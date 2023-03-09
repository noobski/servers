/* eslint-disable no-magic-numbers */
/* eslint-disable no-console */
/* global require */
// eslint-disable-next-line no-unused-vars
const Article = require('./wikihoot_article_generator');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
	cors: {
		origin: '*'
	}
});

/* create a route to provide a list of all rooms and which users are in them */
app.get('/rooms', (req, res) => {
	console.log('sending all info about rooms');
	res.send(users.attendees_in_rooms());
});

class Users {
	constructor(){
		this.users = new Map();
		/* map of users:
			{'username1': {socket, room},
			 'username2': {socket, room},
			 ... }
		*/
	}
	add(username, socket, room){
		this.users.set(username, {socket, room});
		socket.join('lobby');
	}
	remove(username){
		// this.remove_empty_rooms();
		this.users.delete(username);
	}
	/*
	remove_empty_rooms(){
		// remove rooms that have no users in them
		const rooms = Array.from(this.users.values()).map((user) => user.room);
		rooms.forEach((room) => {
			if(this.get_usernames_in(room).length === 0){
				io.to(room).emit('room empty');
			}
		});
	}
	*/
	get_room(username){
		return this.users.get(username).room;
	}
	/* get all rooms and which users are in them */
	attendees_in_rooms(){
		const rooms = new Map();
		this.users.forEach((user, username) => {
			const room = user.room;
			if(rooms.has(room)){
				rooms.get(room).push(username);
			}
			else{
				rooms.set(room, [username]);
			}
		});
		return rooms;
	}
	get_socket(username){
		return this.users.get(username).socket;
	}
	get_usernames_in(room){
		return Array.from(this.users.keys()).filter((username) =>
			this.users.get(username).room === room);
	}
	get_usernames_and_scores_in(room){
		const users_in_room = this.get_usernames_in(room).map((username) => {
			const user = this.users.get(username);
			return {username: username, score: user.score};
		});
		// sort by score
		users_in_room.sort((a, b) => b.score - a.score);
		return users_in_room;
	}
	get_sockets_in(room){
		return this.get_usernames_in_room(room).map((username) =>
			this.users.get(username).socket);
	}
	set_room(username, room){
		const user = this.users.get(username);
		user.room = room;
		user.score = null; // reset score when entering room
		user.socket.join(room);
	}
	exit_room(username){
		const user = this.users.get(username);
		user.socket.leave(user.room);
		user.room = null;
		// TODO: if nobody left in the room, delete it and remove from db
	}
	move_username_to_room(username, to_room){
		// leave current room
		this.exit_room(username);
		// join new room
		this.set_room(username, to_room);
	}
	move_all_to_room(from_room, to_room){
		this.get_usernames_in(from_room).forEach((username) => {
			// leave current room
			this.users.get(username).socket.leave(from_room);
			// join new room
			this.set_room(username, to_room);
		});
		this.delete_room(from_room);
	}
	store_article(roomId, article){
		this.users.set(roomId, article);
	}
	get_article(roomId){
		return this.users.get(roomId);
	}
	delete_room(roomId){
		this.users.delete(roomId);
	}
	set_score(username, score){
		this.users.get(username).score = score;
	}
}

const users = new Users();

io.on('connection', (socket) => {
	socket.on('join', (username) => {
		// new user joins the lobby
		users.add(username, socket, 'lobby');
		socket.username = username;
		// update lobby players
		io.to('lobby').emit('player_list', users.get_usernames_and_scores_in('lobby'));
	});

	socket.on('disconnect', () => {
		// Remove the user from the users directory and let his room know he left
		const username = socket.username;
		if(username)
		{
			const room = users.get_room(username);
			users.remove(username);
			io.to(room).emit('player_left', username);
		}
	});

	socket.on('start', () => {
		// Create a new room and add all waiting sockets to it
		const roomId = `room_${Date.now()}`;
		users.move_all_to_room('lobby', roomId);

		// create a new article
		const article = new Article('en', (selected_title) =>
		{
			users.store_article(roomId, article);
			console.log('loaded '+selected_title);
			// Emit a message to all sockets in the room to start the game
			io.to(roomId).emit('game_start', {
				article_title: selected_title,
				room: roomId,
				players: users.get_usernames_and_scores_in(roomId)
			});
			// send a message to all sockets in the room every second. start with timer = 30, and reduce 1 each second until 0
			let timer = 30;
			const interval = setInterval(() => {
				io.to(roomId).emit('timer', timer);
				timer--;
				if (timer < 0){
					clearInterval(interval);
				}
			}, 1000);
		});
	});

	// get guesses from client
	socket.on('user_guesses', (guesses) => {
		const room = users.get_room(socket.username);
		// clean up guesses array (no duplicates, no empty strings)
		const unique_guesses = [...new Set(guesses)];
		const cleaned_guesses = unique_guesses.filter((guess) => guess !== '');
		// create response
		const article = users.get_article(room);
		const response = [];
		let final_score = 0;
		cleaned_guesses.forEach((guess) => {
			const occurrences = article.get_word_occurrance(guess);
			response.push(occurrences); // {guess: word, total_count: count, variants: variants_count}
			final_score += occurrences.total_count;
		});
		users.set_score(socket.username, final_score);
		socket.emit('score', response);
		// send the player list to all in the room
		io.to(room).emit('player_list', users.get_usernames_and_scores_in(room));
	});

	// restart the game
	socket.on('restart', () => {
		const room = users.get_room(socket.username);
		users.move_username_to_room(username, 'lobby');
		io.to('lobby').emit('player_list', users.get_usernames_and_scores_in('lobby'));
	}
});


server.listen(3111, () => {
	console.log('WikiHoot v1.0 listening on port 3111');
});
