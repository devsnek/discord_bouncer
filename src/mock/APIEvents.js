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

  [APIEvents.GUILD_UPDATE]: {
    handler({ args: [guild] }) {
      return transformGuild(guild);
    },
  },

  [APIEvents.GUILD_DELETE]: {
    handler({ args: [guild] }) {
      return transformGuild(guild);
    },
  },

  [APIEvents.CHANNEL_CREATE]: {
    handler({ args: [channel], client }) {
      const canRead = !channel.permissionsFor || channel.permissionsFor(client.user).has('READ_MESSAGES');
      return transformChannel(channel, canRead);
    },
  },

  [APIEvents.CHANNEL_UPDATE]: {
    handler({ args: [channel], client }) {
      const canRead = !channel.permissionsFor || channel.permissionsFor(client.user).has('READ_MESSAGES');
      return transformChannel(channel, canRead);
    },
  },

  [APIEvents.CHANNEL_DELETE]: {
    handler({ args: [channel], client }) {
      const canRead = !channel.permissionsFor || channel.permissionsFor(client.user).has('READ_MESSAGES');
      return transformChannel(channel, canRead);
    },
  },
};
