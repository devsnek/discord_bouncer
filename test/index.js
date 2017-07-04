require('promise_util');
const auth = require('./auth');
const child_process = require('child_process');
const Snowflake = require('discord.js').Snowflake;

const bouncer = child_process.spawn('./src/discord_bouncer.js');

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
  bouncer.stdin.write(JSON.stringify({ cmd, evt, args, nonce }));
  return promise;
};

bouncer.stdout.on('data', (data) => {
  let payload;
  try {
    payload = JSON.parse(data);
  } catch (err) {
    console.log('AAAA', data.toString());
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
    console.log('READY!');
    send('SUBSCRIBE', 'MESSAGE_CREATE');
  } else if (payload.evt === 'MESSAGE_CREATE') {
    const message = payload.data;
    const content = message.content;
    if (!content.startsWith('```json') && content.endsWith('```')) return;
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
