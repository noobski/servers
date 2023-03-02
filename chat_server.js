/* eslint-disable no-console */
/* global require */
let server, io;
const port = 3200;

start_server_and_wait_for_connections();
function start_server_and_wait_for_connections(){
	const app = require('express')();  /// test
	const http = require('http');
	server = http.Server(app);
	// eslint-disable-next-line no-unused-vars
	const cors = require('cors');
	// one of the below is not required (test which one)
	io = require('socket.io')(server, {
		cors: {
			origin: '*'
		}
	});
	/*
	app.use(cors({
		origin: '*'
	}));
	*/
	server.listen(port, () => {
		console.log('Chat server 1.0, listening on port ' + port);
		console.log('----------------------------------------------');
	});
}
// Server-side code
io.on('connection', (socket) => {
	// Listen for a "join_room" event from the client
	socket.on('join_room', (room_name) => {
		// Join the specified room
		socket.join(room_name);
	});
	// Handle a "message" event from the client
	socket.on('chat_message', (message) => {
		// Send the message to all other sockets in the same room
		const room_name = get_socket_room(socket);
		io.to(room_name).emit('chat_message', message);
	});
});
// Helper function to get the room name for a socket
function get_socket_room(socket) {
	// Return the last room name in the socket's rooms Set
	const rooms = Array.from(socket.rooms);
	return rooms[rooms.length-1];
}
