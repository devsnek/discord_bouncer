// an attempt to mock the discord rpc api, adding on to support rest things

const joi = require('joi');
const { APICommands, APIErrors } = require('../Constants');
const APIError = require('./APIError');
const { transformUser, transformChannel } = require('./APIHelpers');
const APIDispatcherEvents = require('./APIDispatcherEvents');

module.exports = {
  [APICommands.DISPATCH]: {
    handler({ server, client, evt, args }) {
      const event = APIDispatcherEvents[evt];
      if (!event) throw new APIError(APIError.INVALID_EVENT, evt);
      return event.handler({ server, client, evt, args });
    },
  },

  [APICommands.AUTHENTICATE]: {
    validation: () =>
      joi.object().required().keys({
        token: joi.string(),
      }),
    handler({ client, args: { token } }) {
      return client.login(token)
        .then(() => ({
          user: transformUser(client.user),
        }))
        .catch(() => {
          throw new APIError(APIErrors.INVALID_TOKEN, token);
        });
    },
  },

  [APICommands.GET_GUILD]: {
    validation: () =>
      joi.object().required().keys({
        guild_id: joi.string(),
        timeout: joi.number().min(0).max(60),
      }),
    handler({ client, args: { guild_id } }) {
      return new Promise((resolve) => {
        const guild = client.guilds.get(guild_id);
        if (!guild) throw new APIError(APIErrors.INVALID_GUILD, guild_id);
        const onlineMembers = guild.members.filter
        .filter(({ presence }) => presence.status && presence.status !== 'offline')
        .map((member) => ({
          user: transformUser(member.user),
          nick: member.nick,
          status: member.presence.status,
          activity: member.presence.game ? member.presence.game.name : undefined,
        }));
        resolve({
          id: guild.id,
          name: guild.name,
          icon_url: guild.iconURL(),
          members: onlineMembers,
        });
      });
    },
  },

  [APICommands.GET_GUILDS]: {
    handler({ client }) {
      return {
        guilds: client.guilds.map(guild => ({
          id: guild.id,
          name: guild.name,
          icon_url: guild.iconURL(),
        })),
      };
    },
  },

  [APICommands.GET_CHANNEL]: {
    handler({ client, args: { channel_id } }) {
      const channel = client.channels.get(channel_id);
      if (!channel) throw new APIError(APIErrors.INVALID_CHANNEL, channel_id);

      const canRead = !channel.permissionsFor || channel.permissionsFor(client.user).has('READ_MESSAGES');

      return transformChannel(channel, canRead);
    },
  },

  [APICommands.GET_CHANNELS]: {
    handler({ client, args: { guild_id } }) {
      let channels = client.channels;

      if (guild_id) {
        const guild = client.guilds.get(guild_id);
        if (!guild) throw new APIError(APIErrors.INVALID_GUILD, guild_id);
        channels = channels.filter(({ guild: g }) => g && g.id === guild.id);
      }

      return {
        channels: channels.map(({ id, name, type }) => ({ id, name, type })),
      };
    },
  },

  [APICommands.SUBSCRIBE]: {
    handler({ server, evt, args }) {
      return new Promise(resolve => {
        if (!server.events[evt]) throw new APIError(APIErrors.INVALID_EVENT, evt);
        const event = server.events[evt];
        const updater = event.handler({ args });
        setImmediate(() => server.addSubscription(evt, args, updater));
        resolve({ evt });
      });
    },
  },

  [APICommands.UNSUBSCRIBE]: {
    handler({ server, evt, args }) {
      if (!server.events[evt]) throw new APIError(APIError.INVALID_EVENT, evt);

      server.removeSubscription(evt, args);

      return { evt };
    },
  },
};
