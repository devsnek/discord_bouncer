require('promise_util');
const net = require('net');
const path = require('path');
const fs = require('fs');
const { Snowflake } = require('discord.js');

module.exports = (data) => {
  const file = `./${Snowflake.generate()}.sock`;
  const promise = Promise.create();

  const server = net.createServer((c) => {
    c.write(JSON.stringify(data));
    c.end();
    c.on('end', () => {
      server.close();
      if (promise.isPending) promise.resolve(true);
    });
  });
  server.listen(file);
  const timeout = setTimeout(() => {
    server.close();
    if (promise.isPending) promise.resolve(false);
  }, 10e3);

  promise.then(() => {
    server.close();
    clearTimeout(timeout);
    fs.unlink(file, () => {}); // eslint-disable-line no-empty-function
  });

  return { promise, file: path.resolve(file) };
};
