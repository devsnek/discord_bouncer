#!/usr/bin/env node

const snekparse = require('snekparse');
const Discord = require('discord.js');
const MockAPI = require('./mock');
const joi = require('joi');
joi.snowflake = () => joi.string().max(19);

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
const argv = snekparse(process.argv);

const client = new Discord.Client({
  http: {
    host: argv.api_endpoint,
    cdn: argv.cdn_host,
    invite: argv.invite_endpoint,
  },
});
const api = new MockAPI({ client });

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => api.handle(chunk));

process.on('unhandledRejection', api.handleGlobalRejection.bind(api));
process.on('uncaughtException', api.handleGlobalException.bind(api));

api.start();
