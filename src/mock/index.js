const Discord = require('discord.js');
const MockAPI = require('./MockAPI');

const client = new Discord.Client({
  http: {
    api: process.snekv.api_endpoint,
    cdn: process.snekv.cdn_host,
    invite: process.snekv.invite_endpoint,
  },
});

module.exports = new MockAPI({ client });
