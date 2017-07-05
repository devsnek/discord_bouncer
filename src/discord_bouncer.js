#!/usr/bin/env node

const snekparse = require('snekparse');
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';
process.snekv = snekparse(process.argv);

require('promise_util');
const joi = require('joi');
const fs = require('fs');
const MockAPI = require('./mock');
const RPC = require('./rpc');
const uds = require('./utils/uds');

joi.snowflake = () => joi.string().max(19);
process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');

function write(data) {
  const str = JSON.stringify(data);
  if (Buffer.byteLength(str) < 8192) {
    fs.writeSync(1, `${str}\n`);
  } else {
    const { promise, file } = uds(str);
    write({
      cmd: 'UNIX_DOMAIN_SOCKET_UPGRADE',
      evt: 'CREATE',
      data: { file },
      nonce: data.nonce,
    });
    promise.then((success) => {
      write({
        cmd: 'UNIX_DOMAIN_SOCKET_UPGRADE',
        evt: 'DELETE',
        data: { success },
        nonce: data.nonce,
      });
    });
  }
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

  process.on('unhandledRejection', api.globalRejection.bind(api));
  process.on('uncaughtException', api.globalException.bind(api));

  api.start(payload.args);
});

write({
  cmd: 'SELECT',
  evt: null,
  args: {},
  nonce: null,
});
