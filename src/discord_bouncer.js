#!/usr/bin/env node

const snekparse = require('snekparse');
const joi = require('joi');
joi.snowflake = () => joi.string().max(19);

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
process.snekv = snekparse(process.argv);

const MockAPI = require('./mock');
const RPC = require('./rpc');

process.stdin.setEncoding('utf8');

function write(data) {
  process.stdout.write(`${JSON.stringify(data)}\n`);
}

let api = null;
process.stdin.on('data', (chunk) => {
  if (api) return api.handle(chunk);

  let payload;
  try {
    payload = JSON.parse(chunk);
  } catch (err) {
    return;
  }

  if (payload.cmd === 'SELECT') {
    api = { mock: MockAPI, rpc: RPC }[payload.args.interface];
  }

  if (!api) {
    write({
      cmd: 'SELECT',
      evt: 'ERROR',
      args: { message: 'Invalid interface' },
      nonce: payload.nonce,
    });
    return;
  }
  api.on('out', write);
  api.start(payload.args);
});

write({
  cmd: 'SELECT',
  evt: null,
  args: {},
  nonce: null,
});
