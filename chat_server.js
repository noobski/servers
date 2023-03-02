// eslint-disable-next-line no-unused-vars
/* eslint-disable no-console */
/* global require */
const port = 3200;

// use the 'express' api, namespace under 'app'
const app = require('express')();
const http = require('http');
// create an http server (which socket.io uses) that needs the 'express' api to work
const server = http.Server(app);
// get a namespace (io) for socket.io, and give it a handle to the http server. cors as param
const io = require('socket.io')(server, {cors: {origin: '*'}});

// HTML interface :-)  (in the browser try goint to poco.la:3020)
app.get('/', (req, res) => {
	res.send('<div align="center"><h1>Poco.la chat server active</h1></div>');
});

// chat server-side code
io.on('connection', (socket) => {
	socket.on('join_room', (room_name) => {
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
// start server after all is set
server.listen(port, () => {
	console.log('Chat server 1.0, listening on port ' + port);
	console.log('----------------------------------------------');
});
