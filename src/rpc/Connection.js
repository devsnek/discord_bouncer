require('promise_util');
const EventEmitter = require('events');
const WebSocket = require('uws');
const {
  RPC_START_PORT,
  RPC_END_PORT,
  APIErrors,
} = require('../Constants');

let port = RPC_START_PORT;
let ws = null;
let client_id;

class RPCConnection extends EventEmitter {
  connect() {
    if (ws !== null) return;

    if (port > RPC_END_PORT) {
      port = RPC_START_PORT;
      this.emit('disconnected');
      return;
    }

    ws = new WebSocket(`wss://discordapp.io:${port}/?v=1&client_id=${client_id}`);

    ws.onmessage = e => {
      let payload;
      try {
        if (typeof e.data === 'string') {
          payload = JSON.parse(e.data);
        } else {
          throw new Error('payload data not a string');
        }
      } catch (err) {
        this.emit('error', err);
        this.disconnect();
        return;
      }

      payload.interface = 'rpc';
      this.emit('out', payload);
    };

    ws.onopen = () => this.emit('connected');
  }

  disconnect(e) {
    if (e !== null && [APIErrors.CLOSE_ABNORMAL, APIErrors.INVALID_CLIENTID].includes(e.code)) {
      port++;
      ws = null;
      this.connect();
      return;
    }

    if (ws === null) return;
    this.emit('disconnected');
    ws.close();
    ws = null;
  }

  start(args) {
    client_id = args.client_id;
    const p = Promise.create();
    let done = false;
    this.on('connected', () => {
      if (done) return;
      done = true;
      p.resolve(this);
    });
    this.on('disconnected', () => {
      if (done) return;
      done = true;
      p.resolve(null);
    });
    this.connect();
    return p;
  }

  handle(message) {
    if (ws) ws.send(message);
  }
}

module.exports = new RPCConnection();
