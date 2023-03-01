/* eslint-disable no-magic-numbers */
/* eslint-disable no-console */
/* global require */
// eslint-disable-next-line no-unused-vars
const running_local = false; // network

const puzzles = require('./generate_sudoku.js');
const Lobby = require('../public/lib/game_lobby.js');
const lobby = new Lobby('sudoku');
const game = 'sudoku';

// state: connected (after gameover before lobby), waiting (in lobby), playing

start_server_and_wait_for_connections();
function start_server_and_wait_for_connections(){
	// sign up cb on changes in groups, to notify clients
	lobby.group_add_cb_on_change(send_now_playing);
	// set timer to erase high scores on sunday
	set_to_erase_highscores_on_sunday_first_load();
	// TODO: Make this part shorter
	const port = 3100;
	const app = require('express')();  /// test
	const http = require('http');
	const server = http.Server(app);
	// var cors = require('cors');
	const io = require('socket.io')(server, {
		cors: {
			origin: '*'
		}
	});
	server.listen(port, () => {
		console.log('sudoku game server 2.0, listening on port ' + port);
		console.log('----------------------------------------------');
	});
	io.on('connection', connection_conf);
}
function connection_conf(socket){
	socket.on('username', (username) => {
		// if username already is online then disconnect previous user
		const existing_user = lobby.user_by_username(username);
		if(existing_user)
			existing_user.socket.disconnect(true);
		// add new user to the lobby of waiting users
		lobby.user_joined(username, 'waiting', socket, () =>
			send_updates_to_lobby_players());
	});
	socket.on('desired_level', (level) => {
		level = level == '(reset)' ? null : level;
		lobby.user_set_desired_level(socket, level);
		send_updates_to_lobby_players();
	});
	socket.on('board', (show, sq_left, strikes) => {
		// player updating about changes on his board
		const u = lobby.user_by_socket(socket);
		// update players about the progress of this player
		const players = lobby.group_get_users(u.gid);
		players.forEach(r => r.socket.emit('board', u.username, sq_left, strikes,
			show));
		// check if this player won or lost
		if(sq_left==0)
			group_end_of_game(u, true, 'Completed board', u.gid);
		if(strikes>=3)
			player_lost(u, '3 Strikes');
	});
	socket.on('please_start_now', () => start_game());
	socket.on('quit', () =>
		player_lost(lobby.user_by_socket(socket), 'Quitting much?'));
	socket.on('test', () => {
		console.log('test'); // dbg for making the server do stuff from the client
	});
	socket.on('in_lobby', () => {
		// remove user from group if any (for example if refereshed)
		const u = lobby.user_by_socket(socket);
		lobby.group_remove_user(u);
		// user back in 'waiting' mode in lobby
		lobby.user_set_state(u, 'waiting');
		lobby.user_set_desired_level(socket, null);
		send_updates_to_lobby_players();
	});
	socket.on('disconnect', (reason) => {
		const user = lobby.user_by_socket(socket);
		if(!user)
			return;
		console.log(user.username, ' disconnected because ',reason);
		if(user.state == 'playing')
			player_lost(user, 'You disconnected');
		lobby.user_remove_from_lobby(user);
		// TODO: add this here:  send_updates_to_lobby_players
	});
}

// utility functions
function send_now_playing(){
	const waiting_users = lobby.users_by_state('waiting');
	const now_playing = lobby.get_now_playing();
	waiting_users.forEach(u => u.socket.emit('now_playing', now_playing));
}

/* disabled timer to start games every x seconds (for now)
//const countdown = running_local==true ? 5 : 30;
// const ng_timer = {length: countdown, seconds_left: countdown, id: 0};
function ng_timer_tick(){
	// broadcast 'next game' countdown timer
	const w = lobby.users_by_state('waiting');
	w.forEach(u => u.socket.emit('countdown_timer', ng_timer.seconds_left));
	if(!ng_timer.seconds_left)
	{
		// reset counter and start game for all waiting
		ng_timer.seconds_left = ng_timer.length + 1;
		start_game();
	}
	ng_timer.seconds_left--;
	setTimeout(ng_timer_tick, 1000);
}
*/
function start_game(){
	const waiting_users = lobby.users_by_state('waiting');
	let waiting_for_level, usernames_waiting_for_level;
	// start game for each group of players by desired level
	['easy', 'medium', 'hard'].forEach(level => {
		waiting_for_level = waiting_users.filter(u => u.desired_level==level);
		usernames_waiting_for_level = waiting_for_level.map(p => p.username);
		if(!waiting_for_level.length)
			return;
		// create the board to play for this level group
		const board = puzzles.generate_new_board(level);
		// create the group
		const gid = lobby.group_create(waiting_for_level,
			{start_time: new Date(), level: level});
		// tell waiting users to start & change their state to 'playing'
		waiting_for_level.forEach(u => {
			lobby.user_set_state(u, 'playing');
			lobby.user_set_playing_level(u, level); // TODO: only group should have the playing level, not each user
			u.socket.emit('start', board.array, board.show, board.level,
				usernames_waiting_for_level);
			u.gid = gid;
		});
		// update the player list for those still waiting in the lobby
		send_updates_to_lobby_players();
		// keep on file how many people have played to date
		lobby.log_game_stats(true, waiting_for_level.length);
	});
}
function send_updates_to_lobby_players(){
	const player_list = lobby.users_by_state('waiting');
	// prepare users list to send to all players in that group
	const waiting_players = player_list.map(u =>
		({username: u.username, scores: u.scores.filter(s=>s.game==game),
			socket_id: u.socket.id, desired_level: u.desired_level || null,
			sq_left: null, strikes: null}));
	// transmit the list of waiting, playing and high scores to waiting users
	const hs = lobby.get_game_high_scores();
	const games_played = lobby.get_games_played_to_date();
	player_list.map(u => u.socket.emit('waiting_players', waiting_players,
		hs, games_played));
	// send list of 'now playing' in the server
	send_now_playing();
}
// completed_game is if the win is because winner finished the board
function group_end_of_game(winner, completed_game, reason, gid){
	// stop the timer for the group
	lobby.group_stop_timer(gid);
	// tell players the outcome, and move them to 'connected'
	const winner_name = winner ? winner.username : 'nobody';
	lobby.group_get_users(gid).forEach(u => {
		reason = u==winner ?  reason : winner_name+' won';
		u.socket.emit(u==winner ? 'you_won' : 'you_lost', reason);
		lobby.user_set_state(u, 'connected'); // change this. waiting should be in lobby, and this guy should be 'losing and wanting to see rest of game'...
	});
	// check if high score created, and handle it
	if(completed_game)
		check_high_scores(winner, gid);
	// destroy the group
	lobby.group_remove(gid);
}
function player_lost(user, reason){
	const gid = user.gid;
	user.socket.emit('you_lost', reason);
	// tell the other players about this loss
	let playing = lobby.group_get_users(gid);
	playing.forEach(u => u.socket.emit('player_lost', user.username));
	// if this was a single player, finish the game
	if(playing.length==1)
	{
		group_end_of_game(null, false, reason, gid);
		return;
	}
	// check if only one other player left (a new winner)
	if(playing.length==2)
	{
		playing = playing.filter(p => p.username != user.username);
		const winner = playing[0];
		group_end_of_game(winner, false, 'all others lost', gid);
	}
}
function check_high_scores(user){
	if(!user)
		return;
	// check this user's prev. high score for this level
	const level = lobby.group_get_level(user.gid);
	let user_high_score = user.scores.find(s=>s.game==game && s.level==level);
	user_high_score = user_high_score ? user_high_score.score : '99999999:99';
	// create new score string
	const d = new Date();
	let s = (d - lobby.group_get_start_time(user.gid))/1000;
	const m = Math.floor(s/60);
	s = Math.round(s-m*60);
	const new_score = String(m)+':'+(s<10 ? '0'+String(s) : String(s));
	// is this the users' best ever score for this level?
	if(is_better_score(new_score, user_high_score))
	{
		lobby.new_user_high_score(user, level, new_score);
		user.socket.emit('new_high_score', new_score, level);
	}
	// is this an overall high score for this level of the game?
	const u = user.username;
	if(lobby.update_game_high_score(u, level, new_score, is_better_score))
		user.socket.emit('msg', 'New game high score!!');
}
function is_better_score(new_score, prev_score){
	const new_split = new_score.split(':');
	const new_m = parseInt(new_split[0]), new_s = parseInt(new_split[1]);
	const prev_split = prev_score.split(':');
	const prev_m = parseInt(prev_split[0]), prev_s = parseInt(prev_split[1]);
	return(new_m<prev_m || (new_m==prev_m && new_s<prev_s));
}
// function dbg_msg_to_all(gid, msg){
// 	lobby.group_get_users(gid).forEach(u => u.socket.emit('dbg', msg));
// }
function set_to_erase_highscores_on_sunday_first_load(){
	// Calculate the number of milliseconds until the next Sunday at 6:00 AM
	const today = new Date();
	const day = today.getDay(); // 0=sunday, 1=monday, etc.
	const days_till_next_sunday = 7-day;
	const next_sunday = new Date(today.getTime() + days_till_next_sunday*24*3600*1000);
	next_sunday.setHours(6,0,0,0);
	const ms_till_next_sunday = next_sunday.getTime() - today.getTime();
	// Set a timeout to reset the high scores at the calculated time
	setTimeout(erase_highscores, ms_till_next_sunday);
}
function erase_highscores(){
	lobby.reset_game_high_scores();
	// schedule again for next week
	setTimeout(erase_highscores, 7 * 24 * 60 * 60 * 1000);
}
