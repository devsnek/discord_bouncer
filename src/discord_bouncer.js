#!/usr/bin/env node

const Discord = require('discord.js');
const API = require('./API');

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

const client = new Discord.Client();
const api = new API({ client });

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  api.handle(chunk);
});

api.start();

process.on('unhandledRejection', api.handleGlobalRejection.bind(api));
process.on('uncaughtException', api.handleGlobalException.bind(api));
