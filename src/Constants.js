exports.APICommands = keyMirror([
  'DISPATCH',

  'AUTHENTICATE',

  'GET_GUILD',
  'GET_GUILDS',
  'GET_CHANNEL',
  'GET_CHANNELS',

  'SUBSCRIBE',
  'UNSUBSCRIBE',
]);

exports.APIEvents = keyMirror([
  'GUILD_STATUS',
  'GUILD_CREATE',

  'CHANNEL_CREATE',

  'VOICE_CHANNEL_SELECT',
  'VOICE_STATE_CREATE',
  'VOICE_STATE_DELETE',
  'VOICE_STATE_UPDATE',
  'VOICE_CONNECTION_STATUS',
  'SPEAKING_START',
  'SPEAKING_STOP',

  'MESSAGE_CREATE',
  'MESSAGE_UPDATE',
  'MESSAGE_DELETE',

  'READY',
  'ERROR',
]);

exports.APIErrors = {
  UNKNOWN_ERROR: 1000,

  INVALID_PAYLOAD: 4000,
  INVALID_COMMAND: 4002,
  INVALID_GUILD: 4003,
  INVALID_EVENT: 4004,
  INVALID_CHANNEL: 4005,
  INVALID_PERMISSIONS: 4006,
  INVALID_CLIENTID: 4007,
  INVALID_ORIGIN: 4008,
  INVALID_TOKEN: 4009,
  INVALID_USER: 4010,
  INVALID_INVITE: 4011,
};

exports.APIErrorsInternal = {
  1000: (message) => message,
  4000: (message) => message,
  4002: (cmd) => `Invalid command: ${cmd}`,
  4003: (guild_id) => `Invalid guild id: ${guild_id}`,
  4004: (evt) => `Invalid event: ${evt}`,
  4005: (channel_id) => `Invalid channel id: ${channel_id}`,
  4009: (token) => `Invalid token: ${token}`,
};

function keyMirror(arr) {
  return arr.reduce((o, i) => {
    o[i] = i;
    return o;
  }, {});
}
