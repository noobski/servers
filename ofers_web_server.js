/* eslint-disable no-console */
/* global require */
const secure = false;

if(secure)
{
	const express = require('express');
	const fs = require('fs');
	const https = require('https');
	const port = 80; 

	const app = express();

	const key = fs.readFileSync('/etc/letsencrypt/live/poco.la/fullchain.pem');
	const cert = fs.readFileSync('/etc/letsencrypt/live/poco.la/privkey.pem');

	// Create an options object for the HTTPS server
	const options = {
		key: key, cert: cert
	};

	console.log(options);

	app.get('/', (req, res) => {
		console.log('hi');
		res.send('Hello, this is a secure server!');
	});

	// Create the HTTPS server
	const server = https.createServer(options, app);

	// Start the server
	server.listen(port, () => {
		console.log('HTTPS server running on port '+port);
	});
}
else
{
	const express = require('express');
	const app = express();
	const port = 80;
	const server = app.listen(port, listen);
	app.use('', express.static('../public'));
}
function listen(){
	console.log('ofers web server v2.0 listening on port '+port);
}
