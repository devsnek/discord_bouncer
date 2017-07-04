#!/usr/bin/env node

const snekparse = require('snekparse');
const Discord = require('discord.js');
const joi = require('joi');
joi.snowflake = () => joi.string().max(19);

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
process.snekv = snekparse(process.argv);

process.stdin.setEncoding('utf8');

const MockAPI = require('./mock');
const RPC = require('./rpc');
Promise.all([MockAPI, RPC].map(i => i.start()))
.then(([mock, rpc]) => {
  console.log(!!mock, !!rpc);
  let interface = rpc ? null : mock;
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
      interface = rpc;
    } else {
      interface = mock;
    }

    interface.handle(chunk);
  });

  console.log(JSON.stringify({
    cmd: 'DISPATCH',
    evt: 'READY',
    args: {
      v: 1,
      config: {
        cdn_host: mock.client.options.http.cdn.replace('https://', ''),
        api_endpoint: mock.client.options.http.host,
        environment: process.env.NODE_ENV,
      },
    }
  }));
});
