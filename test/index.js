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
  const payload = JSON.stringify({ cmd, evt, args, nonce });
  bouncer.stdin.write(payload);
  console.log(payload);
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
  }

  if (payload.evt === 'READY') {
    send('AUTHENTICATE', {
      token: auth.token,
    }).then(console.log);
  } else if (payload.cmd === 'AUTHENTICATE') {
    // send('GET_CHANNELS', { guild_id: '222078108977594368' });
    // send('DISPATCH', 'MESSAGE_CREATE', {
    //   channel_id: '222079895583457280',
    //   content: 'hi!',
    // }).then(console.log);
    send('SUBSCRIBE', 'MESSAGE_CREATE', {
      channel_id: '222079895583457280',
    }).then(console.log).catch(console.error);
  } else {
    console.log(payload);
  }
});
