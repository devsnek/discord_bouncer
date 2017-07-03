const DJSConstants = require('discord.js/src/util/Constants');
const deepEqual = require('../utils/deep_equal');
const crypto = require('crypto');

const DEDUP_IDS = [];

function deduplicate(id) {
  if (DEDUP_IDS.indexOf(id) > -1) return true;
  DEDUP_IDS.unshift(id);
  DEDUP_IDS.splice(50);
  return false;
}

function getUniqueIdentifier(thing) {
  return crypto.createHash('md5').update(JSON.stringify(thing)).digest('hex');
}

function pick(obj, keys) {
  return keys.reduce((o, k) => {
    o[k] = obj[k];
    return o;
  }, {});
}

function containsSameValues(a, b) {
  return deepEqual(a, pick(b, Object.keys(a)));
}

function containsFilteredValues(obj, filter) {
  for (const k of Object.keys(filter)) {
    if (obj[k] !== filter[k]) return false;
  }
  return true;
}

function transformGuild(guild) {
  const onlineMembers = guild.members
  .filter(({ presence }) => presence.status && presence.status !== 'offline')
  .map((member) => ({
    user: transformUser(member.user),
    nick: member.nick,
    status: member.presence.status,
    activity: member.presence.game ? member.presence.game.name : undefined,
  }));
  return {
    id: guild.id,
    name: guild.name,
    icon_url: guild.iconURL(),
    members: onlineMembers,
  };
}

function transformChannel(channel, fetchMessages) {
  const guild = channel.guild || null;

  return (fetchMessages ? channel.fetchMessages({ limit: 50 }) : Promise.resolve([]))
  .then((messages) => ({
    id: channel.id,
    name: channel.name,
    type: channel.type,
    topic: channel.topic,
    bitrate: channel.bitrate,
    user_limit: channel.userLimit,
    guild_id: guild ? guild.id : null,
    position: channel.calculatedPosition,
    messages,
    voice_states: [],
  }));
}

function transformUser({ id, username, discriminator, avatar, bot }) {
  return {
    id,
    username,
    discriminator,
    avatar,
    bot,
  };
}

function transformTextMessage(m) {
  const member = m.member || null;
  let author_color;
  let nick;
  if (member) {
    author_color = member.displayHexColor;
    nick = member.nickname;
  }

  if (m.channel_id) return Object.assign({ author_color, nick }, m);

  return {
    id: m.id,
    bot: m.author.bot,
    channel_id: m.channel.id,
    content: m.content,
    content_parsed: undefined,
    nick,
    author_color,
    edited_timestamp: m.editedTimestamp,
    timestamp: m.createdTimestamp,
    tts: m.tts,
    mentions: m.mentions.users.map(transformUser),
    mention_everyone: m.mentions.everyone,
    mention_roles: Array.from(m.mentions.roles),
    embeds: m.embeds.map(transformEmbed),
    attachments: m.attachments.map(transformAttachment),
    author: m.author ? transformUser(m.author) : undefined,
    pinned: m.pinned,
    type: DJSConstants.MessageTypes.indexOf(m.type),
  };
}

function transformEmbed(embed) {
  return {
    title: embed.title,
    type: embed.type,
    description: embed.description,
    url: embed.url,
    timestamp: embed.createdTimestamp,
    footer: embed.footer ? {
      text: embed.footer.text,
      icon_url: embed.footer.iconURL,
      proxy_icon_url: embed.footer.proxyIconURL,
    } : undefined,
    image: embed.image ? {
      url: embed.image.url,
      proxy_url: embed.image.proxyURL,
      height: embed.image.height,
      width: embed.image.width,
    } : undefined,
    thumbnail: embed.thumbnail ? {
      url: embed.thumbnail.url,
      proxy_url: embed.thumbnail.proxyURL,
      height: embed.thumbnail.height,
      width: embed.thumbnail.width,
    } : undefined,
    video: embed.video ? {
      url: embed.video.url,
      height: embed.video.height,
      width: embed.video.width,
    } : undefined,
    provider: embed.provider,
    author: embed.author ? {
      name: embed.author.name,
      url: embed.author.url,
      icon_url: embed.author.iconURL,
    } : undefined,
    fields: embed.fields,
  };
}

function transformAttachment(a) {
  return {
    id: a.id,
    filename: a.filename,
    size: a.size,
    url: a.url,
    proxy_url: a.proxyURL,
    height: a.height,
    width: a.width,
  };
}

module.exports = {
  transformGuild,
  transformUser,
  transformChannel,
  transformTextMessage,
  transformEmbed,
  transformAttachment,
  deduplicate,
  containsSameValues,
  containsFilteredValues,
  getUniqueIdentifier,
  pick,
};
