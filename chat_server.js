/* eslint-disable no-console */
/* global require */
const port = 3200;

const app = require('express')();  // user the 'express' api, namespace under 'app'
const http = require('http');
const server = http.Server(app); // create an http server (which socket.io uses) that needs the 'express' api to work
const io = require('socket.io')(server); // get a namespace (io) for socket.io, and give it a handle to the http server

// eslint-disable-next-line no-unused-vars
// const cors = require('cors');
// one of the below is not required (test which one)

/* io = require('socket.io')(server, {
	cors: {
		origin: '*'
	}
});*/

app.get('/', (req, res) => {
	res.send('<div align="center"><h1>Poco.la chat server active</h1></div>');
});

server.listen(port, () => {
	console.log('Chat server 1.0, listening on port ' + port);
	console.log('----------------------------------------------');
});

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
