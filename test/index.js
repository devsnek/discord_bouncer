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


bouncer.stdout.on('data', (data) => {
  data = data.toString().trim();
  let payload;
  try {
    payload = JSON.parse(data);
  } catch (err) {
    console.log('AAAA', err, data);
    return;
  }

  console.log('->', data);

  if (expecting.has(payload.nonce)) {
    const p = expecting.get(payload.nonce);
    if (payload.evt === 'ERROR') p.reject(new Error(payload.data.message));
    if (payload.cmd === 'UNIX_DOMAIN_SOCKET_UPGRADE') {
      switch (payload.evt) {
        case 'CREATE': {
          const socket = net.connect(payload.data.file);
          const chunks = [];
          socket.on('data', (chunk) => chunks.push(chunk));
          socket.on('end', () => {
            expecting.delete(payload.nonce);
            try {
              p.resolve(JSON.parse(Buffer.concat(chunks)));
            } catch (err) {
              p.reject(new Error('Invalid data from unix domain socket'));
            }
          });
          break;
        }
        case 'DELETE':
          expecting.delete(payload.nonce);
          if (!payload.data.success) p.reject(new Error('Unix Domain Socket connection timed out'));
          break;
        default:
          break;
      }
    } else {
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
    send('SUBSCRIBE', 'MESSAGE_CREATE');
  } else if (payload.evt === 'MESSAGE_CREATE') {
    const message = payload.data;
    const content = message.content;
    if (!content.startsWith('```json') || !content.endsWith('```')) return;
    let body;
    try {
      body = JSON.parse(content.replace(/(^```json|```$)/g, '').trim());
    } catch (err) {
      return;
    }
    const { command, args } = body;
    const reply = (output = null, error = false) => {
      send('DISPATCH', 'MESSAGE_CREATE',
        Object.assign({ channel_id: payload.data.channel_id }, {
          content: `\`\`\`json\n${JSON.stringify({ output, error }, null, '  ')}\n\`\`\``,
        }));
    };
    switch (command) {
      case 'ping':
        reply({
          time: Date.now() - message.timestamp,
          unit: 'ms',
        });
        break;
      case 'bounce':
        send(args);
        break;
      default:
        break;
    }
  }
});
