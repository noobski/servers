/* eslint-disable no-magic-numbers */
/* eslint-disable no-console */
/* global require */
const port = 3301, version = '3.0', users_file = './data/users_db.json';
let users, games, db;
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
// eslint-disable-next-line no-unused-vars
const server = app.listen(port, listen);
const fs = require('fs');

/*
USERS DB
--------
{
  "users": [
    {
      "username": "Ofer",
      "scores": [
        {
          "game": "sudoku",
          "level": "medium",
          "score": "8:35"
        }
      ]
    }
  ],
  "games": [
    {
      "game": "sudoku",
      "players_played": 0,
      "games_played": 0,
      "scores": []
    }
  ]
}
*/
// logs are written to $HOME/.pm2/logs/users_server_out.log

function listen(){
	// startup
	console.log('User server '+version+' - listening on port '+port);
	console.log('---');
	// serving of the main page (points static files directory to 'public')
	app.use(express.static('./public/'));
	app.use(express.json({limit: '3mb'}));
	// create db content file if does not exist
	if (!fs.existsSync(users_file))
	{
		const empty = {users: [], games: []};
		const data = JSON.stringify(empty, null, 2);
		fs.writeFileSync(users_file, data);
	}
	// read db file to memory
	read_db_file();
	// configure endpoints (routes)

	// general db API
	app.get('/version/', (req, res) => res.send({version: version}));
	app.get('/get_all_db/', (req, res) => res.send(db));
	app.get('/get_all_users/', (req, res) => res.send(users));
	app.get('/get_all_games/', (req, res) => res.send(games));
	// user API
	app.get('/add_user/:username', (req, res) => {
		const username = req.params.username;
		// check if username already exists
		if(get_user(username))
		{
			res.send({status: 'error', info: 'user already exists'});
			return;
		}
		const new_user = {username: username};
		users.push(new_user);
		res.send({status: 'ok', value: new_user});
		save_db_to_file(res);
	});
	app.get('/get_user/:username', (req, res) => {
		const u = get_user(req.params.username);
		res.send(u ? {status: 'ok', value: u} :
			{status: 'error', info: 'user does not exist'});
	});
	app.get('/get_user_key/:username/:key', (req, res) => {
		const u = get_user(req.params.username);
		res.send(!u ? {status: 'error', info: 'user does not exist'} :
			!u[req.params.key] ? {status: 'error', info: 'key does not exist'} :
				{status: 'ok', value: u[req.params.key]});
	});
	app.get('/set_user_key/:username/:key/:value', (req, res) => {
		const p = req.params;
		const u = get_user(p.username);
		if(!u)
		{
			res.send({status: 'error', info: 'user does not exist'});
			return;
		}
		u[p.key] = JSON.parse(p.value);
		// save to file
		save_db_to_file(res);
		res.send({status: 'ok'});
	});
	// game API
	app.get('/add_game/:game', (req, res) => {
		const game = req.params.game;
		if(games.find(g => g.game==game))
		{
			res.send({status: 'error', value: 'Game already exists'});
			return;
		}
		const new_game = {'game': game, 'players_played': 0, 'games_played': 0};
		games.push(new_game);
		save_db_to_file(res);
		res.send({status: 'ok'});
	});
	app.get('/set_game/:game/:conf', (req, res) => {
		const p = req.params;
		const conf = JSON.parse(p.conf);
		// remove prev. conf entry and add new one
		remove_entry(games, games.find(g => g.game==p.game));
		games.push(conf);
		save_db_to_file(res);
		res.send({status: 'ok'});
	});
	app.get('/get_game/:game', (req, res) => {
		res.send({status: 'ok', value: games.find(g => g.game==req.params.game)});
	});
	app.get('/reset_game_high_scores/:game/:username', (req, res) => {
		const game = games.find(g => g.game==req.params.game);
		const username = req.params.username;
		if(!game && !username)
		{
			res.send({status: 'game not found'});
			return;
		}
		if(!username)
			game.high_scores = [];
		else
		{    // doesn't work!!! xxx
			const u = get_user(username);
			u.scores.forEach(s => {
				if(s.game==game)
					remove_entry(u.scores, s);
			});
		}
		save_db_to_file(res);
		res.send({status: 'ok'});
	});
	app.get('/remove_high_scores/:game', (req, res) => {
		const game = games.find(g => g.game==req.params.game);
		game.high_scores = [];
		save_db_to_file(res);
		res.send({status: 'ok', value: game});
	});
}
// FILE READ/WRITE
function read_db_file(){
	const users_stringified = fs.readFileSync(users_file, {encoding: 'utf8'});
	db = JSON.parse(users_stringified);
	users = db.users;
	games = db.games;
}
function save_db_to_file(){
	const data = {users: users, games: games}; // back to file format
	const string = JSON.stringify(data, null, 2);
	fs.writeFile(users_file, string, ()=>{}); // async
}
// helper functions
function get_user(username){
	return users.find(u => u.username == username);
}
function remove_entry(array, entry){
	const index = array.indexOf(entry);
	if (index > -1)
		array.splice(index, 1);
	return array;
}
