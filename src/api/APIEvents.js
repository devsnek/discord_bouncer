const APIError = require('./APIError');
const { APIErrors, APIEvents } = require('../Constants');
const {
  transformTextMessage,
  transformGuild,
} = require('./APIHelpers');

function messageEvents({ client, args }) {
  const channel = client.channels.get(args.channel_id);
  if (args.channel_id && !channel) throw new APIError(APIErrors.INVALID_CHANNEL, args.channel_id);
  return transformTextMessage(args);
}

module.exports = {
  [APIEvents.MESSAGE_CREATE]: {
    handler: messageEvents,
  },

  [APIEvents.MESSAGE_UPDATE]: {
    handler: messageEvents,
  },

  [APIEvents.MESSAGE_DELETE]: {
    handler: messageEvents,
  },

  [APIEvents.GUILD_CREATE]: {
    handler({ args, client }) {
      return transformGuild(client.guilds.get(args.id));
    },
  },

  [APIEvents.CHANNEL_CREATE]: {
    handler: noop,
  },
};

function noop() {} // eslint-disable-line no-empty-function,
