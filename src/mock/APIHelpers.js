const { MessageTypes } = require('discord.js').Constants;
const deepEqual = require('../utils/deep_equal');

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

function transformGuild(guild, invite = false) {
  return {
    id: guild.id,
    name: guild.name,
    icon_url: invite ? undefined : guild.iconURL(),
    members: invite ? undefined : guild.members
      .filter(({ presence }) => presence.status && presence.status !== 'offline')
      .map(transformMember),
  };
}

function transformMember(m) {
  return {
    user: transformUser(m.user),
    nick: m.nick,
    status: m.presence.status,
    activity: m.presence.game ? m.presence.game.name : null,
  };
}

async function transformChannel(channel, fetchMessages) {
  const guild = channel.guild;
  const messages = fetchMessages ? await channel.messages.fetch({ limit: 50 }) : [];

  return {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    topic: channel.topic,
    bitrate: channel.bitrate,
    user_limit: channel.userLimit,
    nsfw: channel.nsfw,
    guild_id: guild ? guild.id : null,
    position: channel.calculatedPosition,
    messages: messages.map(transformTextMessage),
    voice_states: [],
  };
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
  const member = m.member;
  let author_color = null;
  let nick = null;
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
    content_parsed: [],
    nick,
    author_color,
    edited_timestamp: m.editedTimestamp,
    timestamp: m.createdTimestamp,
    tts: m.tts,
    mentions: m.mentions.users.map(transformUser),
    mention_everyone: m.mentions.everyone,
    mention_roles: Array.from(m.mentions.roles).map(transformRole),
    embeds: m.embeds.map(transformEmbed),
    attachments: m.attachments.map(transformAttachment),
    author: m.author ? transformUser(m.author) : undefined,
    pinned: m.pinned,
    type: MessageTypes.indexOf(m.type),
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

function transformInvite(i) {
  return {
    code: i.code,
    guild: transformGuild(i.guild, true),
    channel: {
      id: i.channel.id,
      name: i.channel.name,
      type: i.channel.type,
    },
    inviter: transformUser(i.inviter),
    max_uses: i.maxUses,
    max_age: i.maxAge,
    temporary: i.temporary,
    created_at: i.createdTimestamp,
    revoked: i.revoked,
  };
}

function transformRole(r) {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    hoist: r.hoist,
    position: r.calculatedPosition,
    permissions: r.permissions,
    managed: r.managed,
    mentionable: r.mentionable,
  };
}


module.exports = {
  transformGuild,
  transformUser,
  transformChannel,
  transformTextMessage,
  transformEmbed,
  transformAttachment,
  transformInvite,
  containsSameValues,
  containsFilteredValues,
  pick,
};
