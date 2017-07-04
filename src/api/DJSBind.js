const DJSConstants = require('discord.js/src/util/Constants');

module.exports = ({ server, client }) => {
  for (const [external, internal] of Object.entries(DJSConstants.Events)) {
    if (!server.events[external]) continue;
    client.on(internal, (...args) => {
      const event = server.events[external];
      Promise.resolve(event.handler({
        server,
        client,
        args,
      }))
      .then((data) => server.dispatchToSubscriptions(external, data));
    });
  }
};
