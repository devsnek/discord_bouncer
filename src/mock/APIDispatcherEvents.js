const joi = require('joi');
const APIError = require('./APIError');
const { APIErrors, APIEvents } = require('../Constants');
const {
  transformTextMessage,
  transformGuild,
  transformChannel,
  transformUser,
} = require('./APIHelpers');

module.exports = {
  [APIEvents.MESSAGE_CREATE]: {
    validation: () =>
      joi.object().required().keys({
        channel_id: joi.snowflake().required(),
      }),
    handler({ client, args }) {
      const channel = client.channels.get(args.channel_id);
      if (!channel) throw new APIError(APIErrors.INVALID_CHANNEL, args.channel_id);
      return channel.send(args).then((m) => transformTextMessage(m));
    },
  },

  [APIEvents.MESSAGE_UPDATE]: {
    validation: () =>
      joi.object().required().keys({
        channel_id: joi.snowflake().required(),
        message_id: joi.snowflake().required(),
      }),
    handler({ client, args }) {
      const channel = client.channels.get(args.channel_id);
      if (!channel) throw new APIError(APIErrors.INVALID_CHANNEL, args.channel_id);
      const content = args.content || null;
      return channel.fetchMessage(args.message_id)
        .then((message) => message.edit(content, args))
        .then((m) => transformTextMessage(m));
    },
  },

  [APIEvents.MESSAGE_DELETE]: {
    validation: () =>
      joi.object().required().keys({
        channel_id: joi.snowflake().required(),
        message_id: joi.snowflake().required(),
      }),
    handler({ client, args }) {
      const channel = client.channels.get(args.channel_id);
      if (!channel) throw new APIError(APIErrors.INVALID_CHANNEL, args.channel_id);
      return channel.fetchMessage(args.message_id)
        .then((message) => message.delete())
        .then((m) => transformTextMessage(m));
    },
  },

  [APIEvents.GUILD_UPDATE]: {
    validation: () =>
      joi.object().required().keys({
        guild_id: joi.snowflake().required(),
      }),
    handler({ client, args }) {
      const guild = client.guilds.get(args.guild_id);
      if (!guild) throw new APIError(APIErrors.INVALID_GUILD, args.guild_id);
      return guild.edit(args).then((g) => transformGuild(g));
    },
  },

  [APIEvents.MEMBER_BAN_ADD]: {
    validation: () =>
      joi.object().required().keys({
        guild_id: joi.snowflake().required(),
        member_id: joi.snowflake().required(),
      }),
    handler({ client, args }) {
      const guild = client.guilds.get(args.guild_id);
      if (!guild) throw new APIError(APIErrors.INVALID_GUILD, args.guild_id);
      return guild.ban(args.member_id, {
        reason: args.reason,
        days: args['delete-message-days'],
      })
      .then((u) => {
        if (typeof u === 'string') return { id: u };
        return transformUser(u.user ? u.user : u);
      });
    },
  },

  [APIEvents.MEMBER_BAN_REMOVE]: {
    validation: () =>
      joi.object().required().keys({
        guild_id: joi.snowflake().required(),
        member_id: joi.snowflake().required(),
      }),
    handler({ client, args }) {
      const guild = client.guilds.get(args.guild_id);
      if (!guild) throw new APIError(APIErrors.INVALID_GUILD, args.guild_id);
      return guild.unban(args.member_id, args.reason)
      .then((u) => {
        if (typeof u === 'string') return { id: u };
        return transformUser(u.user || u);
      });
    },
  },

  [APIEvents.MEMBER_KICK]: {
    validation: () =>
      joi.object().required().keys({
        guild_id: joi.snowflake().required(),
        member_id: joi.snowflake().required(),
      }),
    handler({ client, args }) {
      const guild = client.guilds.get(args.guild_id);
      if (!guild) throw new APIError(APIErrors.INVALID_GUILD, args.guild_id);
      return guild.fetchMember(args.member_id)
        .catch(() => { throw new APIError(APIErrors.INVALID_USER, args.member_id); })
        .then((m) => m.kick(args.reason))
        .then((m) => transformUser(m.user));
    },
  },

  [APIEvents.CHANNEL_CREATE]: {
    validation: () =>
      joi.object().required().keys({
        guild_id: joi.snowflake(),
        user_id: joi.snowflake(),
      }),
    handler({ client, args }) {
      const guild = client.guilds.get(args.guild_id);
      if (!guild) throw new APIError(APIErrors.INVALID_GUILD, args.guild_id);
      return guild.createChannel(args.name, args.type)
        .then((c) => transformChannel(c));
    },
  },

  [APIEvents.CHANNEL_UPDATE]: {
    validation: () =>
      joi.object().required().keys({
        channel_id: joi.snowflake().required(),
      }),
    handler({ client, args }) {
      const channel = client.channels.get(args.channel_id);
      if (!channel) throw new APIError(APIErrors.INVALID_CHANNEL, args.channel_id);
      return channel.edit(args).then((c) => transformChannel(c));
    },
  },

  [APIEvents.CHANNEL_DELETE]: {
    validation: () =>
      joi.object().required().keys({
        channel_id: joi.snowflake().required(),
      }),
    handler({ client, args }) {
      const channel = client.channels.get(args.channel_id);
      if (!channel) throw new APIError(APIErrors.INVALID_CHANNEL, args.channel_id);
      return channel.delete().then((c) => transformChannel(c));
    },
  },

  STATUS_UPDATE: {
    validation: () =>
      joi.object().required().keys({
        since: joi.number().integer().optional(),
        afk: joi.boolean().optional(),
        game: joi.object().optional().keys({
          name: joi.string().required(),
          type: joi.number().integer().optional(),
          url: joi.string().optional(),
        }),
      }),
    handler({ client, args }) {
      return client.user.setPresence(args).then(() => client.user.localPresence);
    },
  },
};
