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
  'GUILD_CREATE',
  'GUILD_UPDATE',
  'GUILD_DELETE',

  'CHANNEL_CREATE',
  'CHANNEL_UPDATE',
  'CHANNEL_DELETE',

  'CHANNEL_OVERWRITE_CREATE',
  'CHANNEL_OVERWRITE_UPDATE',
  'CHANNEL_OVERWRITE_DELETE',

  'MEMBER_KICK',
  'MEMBER_PRUNE',
  'MEMBER_BAN_ADD',
  'MEMBER_BAN_REMOVE',
  'MEMBER_UPDATE',
  'MEMBER_ROLE_UPDATE',

  'ROLE_CREATE',
  'ROLE_UPDATE',
  'ROLE_DELETE',

  'INVITE_CREATE',
  'INVITE_UPDATE',
  'INVITE_DELETE',

  'WEBHOOK_CREATE',
  'WEBHOOK_UPDATE',
  'WEBHOOK_DELETE',

  'EMOJI_CREATE',
  'EMOJI_UPDATE',
  'EMOJI_DELETE',

  'MESSAGE_CREATE',
  'MESSAGE_UPDATE',
  'MESSAGE_DELETE',

  'VOICE_CHANNEL_SELECT',
  'VOICE_STATE_CREATE',
  'VOICE_STATE_DELETE',
  'VOICE_STATE_UPDATE',
  'VOICE_CONNECTION_STATUS',
  'SPEAKING_START',
  'SPEAKING_STOP',

  'TYPING_START',
  'TYPING_STOP',

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
