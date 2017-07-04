require('promise_util');
const auth = require('./auth');
const child_process = require('child_process');

const bouncer = child_process.spawn('./src/discord_bouncer.js');

const expecting = new Map();

const send = (cmd, evt, args = {}) => {
  if (typeof evt !== 'string') {
    args = evt;
    evt = undefined;
  }
  const nonce = Date.now().toString();
  const promise = Promise.create();
  expecting.set(nonce, promise);
  bouncer.stdin.write(JSON.stringify({ cmd, evt, args, nonce }));
  return promise;
};

bouncer.stdout.on('data', (message) => {
  let payload;
  try {
    payload = JSON.parse(message);
  } catch (err) {
    console.log('AAAA', message.toString());
    return;
  }

  if (expecting.has(payload.nonce)) {
    const p = expecting.get(payload.nonce);
    if (payload.evt === 'ERROR') p.reject(new Error(payload.data.message));
    else p.resolve(payload);
    expecting.delete(payload.nonce);
  }

  if (payload.evt === 'READY') {
    send('AUTHENTICATE', {
      token: auth.token,
    });
  } else if (payload.cmd === 'AUTHENTICATE') {
    send('SUBSCRIBE', 'MESSAGE_CREATE');
  } else if (payload.evt === 'MESSAGE_CREATE') {
    if (payload.data.content !== '!ping') return;
    send('DISPATCH', 'MESSAGE_CREATE', {
      channel_id: payload.data.channel_id,
      content: 'pong!',
    });
  }
});
