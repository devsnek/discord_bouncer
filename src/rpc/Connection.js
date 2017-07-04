const EventEmitter = require('events');
const WebSocket = require('uws');
const {
  RPC_START_PORT,
  RPC_END_PORT,
  APICommands,
  APIEvents,
} = require('../Constants');

let port = RPC_START_PORT;
let ws = null;

class RPCConnection extends EventEmitter {
  connect() {
    if (ws !== null) return;

    if (port > RPC_END_PORT) {
      port = RPC_START_PORT;
      this.emit('disconnected');
      return;
    }

    ws = new WebSocket(`wss://discordapp.io:${port}/?v=1`);

    ws.onmessage = e => {
      let payload;
      try {
        if (typeof e.data === 'string') {
          payload = JSON.parse(e.data);
        } else {
          throw new Error('payload data not a string');
        }
      } catch (e) {
        this.emit('error', e);
        this.disconnect();
        return;
      }      
    };

    ws.onopen = () => console.log('open');
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
}

module.exports = new RPCConnection();
