const joi = require('joi');
const { WSEvents: Events } = require('discord.js/src/util/Constants');
const APIError = require('./APIError');
const { APIErrors } = require('../Constants');
const { transformTextMessage } = require('./APIHelpers');

module.exports = {
  [Events.MESSAGE_CREATE]: {
    validation: () =>
      joi.object().keys({
        channel_id: joi.string().required(),
      }),
    handler({ client, args }) {
      const channel = client.channels.get(args.channel_id);
      if (!channel) throw new APIError(APIErrors.INVALID_CHANNEL, args.channel_id);
      return channel.send(args).then((m) => transformTextMessage(m));
    },
  },

  [Events.MESSAGE_EDIT]: {
    validation: () =>
      joi.object().keys({
        channel_id: joi.string().required(),
        message_id: joi.string().required(),
      }),
    handler({ client, args }) {
      const channel = client.channels.get(args.channel_id);
      if (!channel) throw new APIError(APIErrors.INVALID_CHANNEL, args.channel_id);
      return channel.fetchMessage(args.message_id)
        .then((message) => message.edit(args))
        .then((m) => transformTextMessage(m));
    },
  },
};
