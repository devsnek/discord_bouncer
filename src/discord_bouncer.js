#!/usr/bin/env node

const snekparse = require('snekparse');
const Discord = require('discord.js');
const MockAPI = require('./mock');
const RPC = require('./rpc');
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

let interface;

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  if (interface) return interface.handle(chunk);
  let payload;
  try {
    payload = JSON.parse(chunk);
  } catch (err) {
    return;
  }

  if (payload.cmd === 'AUTHORIZE' || (
    payload.args && (payload.args.client_id || payload.args.rpc_token)
  )) {
    interface = RPC;
    rpc.on('connection', () => rpc.handle(chunk));
    RPC.connect();
  } else {
    interface = new MockAPI({ client });
    interface.start();
    interface.handle(chunk);
  }

  if (process.env.NODE_ENV === 'production') {
    process.on('unhandledRejection', api.handleGlobalRejection.bind(api));
    process.on('uncaughtException', api.handleGlobalException.bind(api));
  }
});

process.stdout.write(JSON.stringify({
  cmd: 'DISPATCH',
  evt: 'READY',
  args: {
    v: 1,
    config: {
      cdn_host: client.options.http.cdn.replace('https://', ''),
      api_endpoint: client.options.http.host,
      environment: process.env.NODE_ENV,
    },
  }
}));
