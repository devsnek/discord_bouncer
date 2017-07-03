exports.APICommands = keyMirror([
  'DISPATCH',

  'AUTHORIZE',

  'GET_GUILD',
  'GET_GUILDS',
  'GET_CHANNEL',
  'GET_CHANNELS',

  'SUBSCRIBE',
  'UNSUBSCRIBE',
]);

function keyMirror(arr) {
  return arr.reduce((o, i) => {
    o[i] = i;
    return o;
  }, {});
}
