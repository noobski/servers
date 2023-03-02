/* eslint-disable no-console */
// TODO:
// - clean up the users and connections db part
// FUTURE:
// - make the users db persistent (file based, with json)
/* global require */
let server, io;
const connections = [], port = 3000;

start_server_and_wait_for_connections();
function start_server_and_wait_for_connections(){
	const app = require('express')();  /// test
	// eslint-disable-next-line no-unused-vars
	const fs = require('fs');
	const http = require('http');
	server = http.Server(app);
	const cors = require('cors');
	// one of the below is not required (test which one)
	io = require('socket.io')(server, {
		cors: {
			origin: '*'
		}
	});
	app.use(cors({
		origin: '*'
	}));
	server.listen(port, () => {
		console.log('Tetris game server 3.4, listening on port ' + port);
		console.log('----------------------------------------------');
	});
	io.on('connection', configure_protocol_on_each_connection);
}
function configure_protocol_on_each_connection(socket){
	// add to list of open connections
	connections_new(socket);
	// tell the connection its socket.id
	socket.emit('socket_id', socket.id);
	// configure protocol
	socket.on('ready', (socket_id_to_play_with) => { // user is 'ready to play'
		const c1 = connections_by_socket(socket);
		const c2 = connections_by_socket_id(socket_id_to_play_with);
		connections_add_to_rival_list(c1, socket_id_to_play_with);
		connections_change_state(c1, 'ready');
		// ensure rival is waiting to play, and wants to play with p1
		if(!(c2 && c2.state == 'ready' && connections_check_in_rival_list(c2, socket.id)))
		{
			console.log('other player not ready or doesnt want to play w you');
			connections_print();
			return;
		}
		// mark the 2 players as 'playing'
		connections_change_state(c1, 'playing');
		connections_change_state(c2, 'playing');
		c1.partner_socket = c2.socket, c2.partner_socket = c1.socket;
		connections_clear_rival_list(c1);
		connections_clear_rival_list(c2);
		// create a brick sequence list for the players
		const a=[], types_of_bricks = 7, list_length = 250;
		for(let i=0; i<list_length; i++)
			a.push(Math.floor(Math.random()*types_of_bricks));
		// tell the players to start playing
		console.log('GO! '+c1.username+' and '+c2.username);
		c1.socket.emit('start', {rival_username: c2.username, bricks: a,
			your_socket_id: c1.socket.id, rival_socket_id: c2.socket.id});
		c2.socket.emit('start', {rival_username: c1.username, bricks: a,
			your_socket_id: c2.socket.id, rival_socket_id: c1.socket.id});
		send_scores(socket);
		connections_print();
	});
	socket.on('msg', (data) => {
		const c1 = connections_by_socket(socket);
		const c2 = connections_by_socket(c1.partner_socket);
		if (!c2)
		{
			console.log('ERROR: Received msg from player without partner. disconnecting him');
			send_disconnect(c1);
			return;
		}
		// pass on message to other player
		c2.socket.emit('msg', data);
	});
	socket.on('i_lost', () => {
		const c1 = connections_by_socket(socket);
		const c2 = connections_by_socket(c1.partner_socket);
		// if user says he lost, increase score for other user
		if(c2)
		{
			users_score_rank(c2.username, 1, 1);
			// pass on message to other player
			c2.socket.emit('i_lost');
		}
		send_scores(socket);
	});
	socket.on('username', (username) => {
		// update socket database with username, and update username database
		connections_by_socket(socket).username = username;
		users_add(username);
		// send the scores to this socket and its partner if it has one
		send_scores(socket);
		// debug
		console.log('+ New connection '+username+' (socket_id: '+socket.id+') '+ connections.length +
          ' sockets connected.');
		connections_print();
	});
	socket.on('score', (payload) => {
		const c1 = connections_by_socket(socket);
		const c2 = connections_by_socket(c1.partner_socket);
		if(!c1 || !c2)
			return;
		if(payload=='reset_score')
		{
			users_score_set(c1.username, 0);
			users_score_set(c2.username, 0);
		}
		if(payload=='score_up_me')
			users_score_rank(c1.username, 1, 0);
		if(payload=='score_up_other')
			users_score_rank(c2.username, 1, 0);
		send_scores(socket);
	});
	socket.on('chat', (msg) => {
		const c1 = connections_by_socket(socket);
		msg = c1.username+': '+msg;
		if(connections_get_state(c1) == 'playing')
		{
			// user is in a game, send his msg to other player
			const c2 = connections_by_socket(c1.partner_socket);
			c1.socket.emit('chat', msg);
			c2.socket.emit('chat', msg);
		}
		else
		{
			// user is in lobby, send his msg to all waiting players
			// create list of waiting connections
			const waiting_connections = connections.filter(c =>
				(c.username && c.state!='playing'));
			// transmit the msg to all waiting connections
			waiting_connections.forEach(c => c.socket.emit('chat', msg));
		}
	});
	socket.on('quit', () => {
		const c1 = connections_by_socket(socket);
		const c2 = connections_by_socket(c1.partner_socket);
		[c1, c2].forEach(c => {
			connections_change_state(c, 'connected');
			c.partner_socket = null;
		});
		c2.socket.emit('quit');
	});
	socket.on('disconnect', () => {
		const c1 = connections_by_socket(socket);
		const c2 = connections_by_socket(c1.partner_socket);
		send_disconnect(c1);
		if(c2)
			send_disconnect(c2);
		connections_remove(c1);
		connections_print();
	});
}

// utility functions
function send_player_list_to_all(){
	// create list of waiting connections
	const waiting_connections = connections.filter(c =>
		(c.username && c.state!='playing'));
	const waiting_players = [];
	waiting_connections.forEach(c => {
		// player is: {name: , socket_id: , rivals: }
		waiting_players.push({name: c.username, socket_id: c.socket.id,
			rivals: c.rival_candidates});
	});
	// transmit the list to all waiting connections
	waiting_connections.forEach(c => c.socket.emit('players', waiting_players));
}
function send_scores(socket){
	const c1 = connections_by_socket(socket);
	const c2 = connections_by_socket(c1.partner_socket);
	if(!c1 || !c2)
		return;
	const user1 = users_get(c1.username), user2 = users_get(c2.username);
	const s1 = user1.score, r1 = user1.rank;
	const s2 = user2.score, r2 = user2.rank;
	c1.socket.emit('score', {score1: s1, score2: s2, rank1: r1, rank2: r2});
	c2.socket.emit('score', {score1: s2, score2: s1, rank1: r2, rank2: r1});
}
function send_disconnect(connection){
	connection.socket.emit('msg', {type:'disconnect'});
	connections_change_state(connection, 'connected');
	connection.partner_socket = null;
}

// Users DB: (without persistant storage yet)
const users = [];
function users_add(username){
	if (!users_get(username))
		users.push({name: username, rank: 0, score: 0});
	send_player_list_to_all();
}
function users_score_rank(username, inc_score=0, inc_rank=0){
	const user = users_get(username);
	user.score += inc_score, user.rank += inc_rank;
	return {score: user.score, rank: user.rank};
}
function users_score_set(username, new_score){
	users_get(username).score = new_score;
}
function users_get(username){
	return users.find((u) => u.name == username);
}

// Connections DB
// - each connection is {username, socket, state, partner_socket}
// - 'state' of connection: 'connected', 'ready', 'playing'
function connections_new(socket){
	connections.push({username: null, socket: socket,
		state: 'connected', partner_socket: null, rival_candidates: []});
}
function connections_change_state(connection, new_state){
	connection.state = new_state;
	send_player_list_to_all();
}
function connections_get_state(connection){
	return connection.state;
}
function connections_remove(connection){
	connections.splice(connections.indexOf(connection), 1);
	send_player_list_to_all();
}
function connections_by_socket(socket){
	return connections.find((c) => c.socket == socket);
}
function connections_by_socket_id(socket_id){
	return connections.find((c) => c.socket.id == socket_id);
}
function connections_print(){
	console.log('--- connections:');
	connections.forEach(c => {
		let s = '';
		c.rival_candidates.forEach(r => s += r + ',');
		console.log(c.username+' ('+c.socket.id+') - '+c.state+' '+s);
	});
	console.log('--- ');
}
function connections_add_to_rival_list(c, socket_id_to_play_with){
	c.rival_candidates.push(socket_id_to_play_with);
}
function connections_clear_rival_list(c){
	c.rival_candidates = [];
}
function connections_check_in_rival_list(c, socket_id){
	return c.rival_candidates.find(e => e == socket_id);
}
// 215
