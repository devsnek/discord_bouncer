require('promise_util');
const auth = require('./auth');
const child_process = require('child_process');
const Snowflake = require('discord.js').Snowflake;
const net = require('net');

const bouncer = child_process.spawn('./src/discord_bouncer.js', {
  env: Object.assign({ NODE_ENV: 'development' }, process.env),
});

const expecting = new Map();

const send = (cmd, evt, args = {}) => {
  if (typeof cmd === 'object') {
    evt = cmd.evt;
    args = cmd.args;
    cmd = cmd.cmd;
  } else if (typeof evt !== 'string') {
    args = evt;
    evt = undefined;
  }
  const nonce = Snowflake.generate();
  const promise = Promise.create();
  expecting.set(nonce, promise);
  const payload = JSON.stringify({ cmd, evt, args, nonce });
  bouncer.stdin.write(payload);
  console.log('<-', payload);
  return promise;
};


bouncer.stdout.on('data', handleData);

function handleData(data) {
  data = data.toString().trim();
  let payload;
  try {
    payload = JSON.parse(data);
  } catch (err) {
    console.log('AAAA', err, data);
    return;
  }

  if (Buffer.byteLength(data) < 8192) {
    console.log('->', data);
  } else {
    console.log('-> (LONG)', JSON.stringify({ cmd: payload.cmd, evt: payload.evt, nonce: payload.nonce }));
  }

  if (expecting.has(payload.nonce)) {
    const p = expecting.get(payload.nonce);
    if (payload.evt === 'ERROR') p.reject(new Error(payload.data.message));
    if (payload.cmd !== 'UNIX_DOMAIN_SOCKET_UPGRADE') {
      expecting.delete(payload.nonce);
      p.resolve(payload);
    }
  }

  if (payload.cmd === 'SELECT') {
    send('SELECT', { interface: 'mock' });
  } else if (payload.evt === 'READY') {
    send('AUTHENTICATE', {
      token: auth.token,
    });
  } else if (payload.cmd === 'AUTHENTICATE') {
    console.log('READY!');
    send('SUBSCRIBE', 'MESSAGE_CREATE', {
      // channel_id: '201803114049699849',
    });
  } else if (payload.cmd === 'UNIX_DOMAIN_SOCKET_UPGRADE') {
    switch (payload.evt) {
      case 'CREATE': {
        const socket = net.connect(payload.data.file);
        const chunks = [];
        socket.on('data', (chunk) => chunks.push(chunk));
        socket.on('end', () => {
          handleData(Buffer.concat(chunks));
        });
        break;
      }
      case 'DELETE':
        break;
      default:
        break;
    }
  } else if (payload.evt === 'MESSAGE_CREATE') {
    const message = payload.data;
    const content = message.content;
    if (!content.startsWith('t!')) return;
    const [command, ...args] = content.replace('t!', '').trim().split(' ');
    const reply = (content) => {
      send('DISPATCH', 'MESSAGE_CREATE', {
        channel_id: payload.data.channel_id,
        content,
      });
    };
    switch (command) {
      case 'ping':
        reply(`${Date.now() - message.timestamp}ms`);
        break;
      case 'bounce':
	const packet = JSON.parse(args.join(' ').replace(/^```json|```$/g, ''));
        send(packet).then(() => console.log('Bounce success'));
        break;
      default:
        break;
    }
  }
}
