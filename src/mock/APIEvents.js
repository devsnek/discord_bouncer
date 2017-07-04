const { APIEvents } = require('../Constants');
const {
  transformTextMessage,
  transformGuild,
  transformChannel,
} = require('./APIHelpers');

function messageEvents({ args: [message] }) {
  return transformTextMessage(message);
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
    handler({ args: [{ id }], client }) {
      return transformGuild(client.guilds.get(id));
    },
  },

  [APIEvents.CHANNEL_CREATE]: {
    handler({ args: [channel], client }) {
      const canRead = !channel.permissionsFor || channel.permissionsFor(client.user).has('READ_MESSAGES');
      return transformChannel(channel, canRead);
    },
  },
};
