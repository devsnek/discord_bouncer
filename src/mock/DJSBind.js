const DJSConstants = require('discord.js/src/util/Constants');

module.exports = ({ server, client }) => {
  for (const [external, internal] of Object.entries(DJSConstants.Events)) {
    const event = server.events[external];
    if (!event || !event.handler) continue;
    client.on(internal, (...args) => {
      Promise.resolve(event.handler({
        server,
        client,
        args,
      }))
        .then((data) => server.dispatchToSubscriptions(external, data));
    });
  }
};
