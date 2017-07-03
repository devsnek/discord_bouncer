const Discord = require('discord.js');
// const API = require('./API');

const Client = new Discord.Client();

const api = new API({ term, client });

api.start();

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  api.handle(JSON.parse(chunk));
});
