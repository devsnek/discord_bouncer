const DJSConstants = require('discord.js/src/util/Constants');

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
  let colorString;
  let nick;
  if (member) {
    colorString = member.displayColorHex;
    nick = member.nickname;
  }

  return {
    id: m.id,
    bot: m.author ? m.author.bot : undefined,
    channel_id: m.channel.id,
    content: m.content,
    content_parsed: undefined,
    nick,
    author_color: colorString,
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
    footer: {
      text: embed.footer.text,
      icon_url: embed.footer.iconURL,
      proxy_icon_url: embed.footer.proxyIconURL,
    },
    image: {
      url: embed.image.url,
      proxy_url: embed.image.proxyURL,
      height: embed.image.height,
      width: embed.image.width,
    },
    thumbnail: {
      url: embed.thumbnail.url,
      proxy_url: embed.thumbnail.proxyURL,
      height: embed.thumbnail.height,
      width: embed.thumbnail.width,
    },
    video: {
      url: embed.video.url,
      height: embed.video.height,
      width: embed.video.width,
    },
    provider: embed.provider,
    author: {
      name: embed.author.name,
      url: embed.author.url,
      icon_url: embed.author.iconURL,
    },
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
  transformUser,
  transformChannel,
  transformTextMessage,
  transformEmbed,
  transformAttachment,
};
