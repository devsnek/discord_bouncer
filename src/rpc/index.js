require('promise_util');
const RPC = require('./Connection');

module.exports = {
  start() {
    const p = Promise.create();
    let done = false;
    RPC.on('connected', () => {
      if (done) return;
      done = true;
      p.resolve(RPC);
    });
    RPC.on('disconnected', () => {
      if (done) return;
      done = true;
      p.resolve(null);
    });
    RPC.connect();
    return p;
  }
}
