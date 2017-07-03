const auth = require('./auth');
const child_process = require('child_process');

const bouncer = child_process.spawn('./src/discord_bouncer.js');

const send = (cmd, evt, args = {}) => {
  if (typeof evt !== 'string') {
    args = evt;
    evt = undefined;
  }
  const payload = JSON.stringify({ cmd, evt, args, nonce: Date.now().toString() });
  bouncer.stdin.write(payload);
  console.log(payload);
};

bouncer.stdout.on('data', (message) => {
  const payload = JSON.parse(message);

  console.log(payload);
  if (payload.evt === 'READY') {
    send('AUTHENTICATE', {
      token: auth.token,
    });
  } else if (payload.cmd === 'AUTHENTICATE') {
    // send('GET_CHANNELS', { guild_id: '222078108977594368' });
    send('DISPATCH', 'MESSAGE_CREATE', {
      channel_id: '222079895583457280',
      content: 'hi!',
    });
  }
});
