const joi = require('joi');
const {
  APIErrors,
  APIEvents,
} = require('../Constants');
const APICommands = require('./APICommands');
const APIError = require('./APIError');

class API {
  constructor({ client }) {
    this.client = client;
    this.commands = APICommands;
  }

  handle(message) {
    let payload = {};

    new Promise((resolve) => {
      try {
        payload = JSON.parse(message);
      } catch (e) {
        throw new APIError(APIErrors.INVALID_PAYLOAD, 'Invalid payload, expected json');
      }

      if (!payload.nonce) throw new APIError(APIErrors.INVALID_PAYLOAD, 'Payload requires a nonce');

      const command = this.commands[payload.cmd];
      if (!command) throw new APIError(APIErrors.INVALID_COMMAND, payload.cmd);
      resolve(command);
    })
    .then((command) =>
      new Promise(resolve => {
        if (command.validation) {
          joi.validate(payload.args, command.validation(), { convert: false }, err => {
            if (err) throw new APIError(APIErrors.INVALID_PAYLOAD, err.message);
            resolve(command);
          });
        } else {
          resolve(command);
        }
      })
    )
    .then((command) =>
      command.handler({
        server: this,
        client: this.client,
        cmd: payload.cmd,
        evt: payload.evt,
        nonce: payload.nonce,
        args: payload.args || {},
      })
    )
    .then(data => this.dispatch(payload.nonce, payload.cmd, null, data))
    .catch((err) => this.error(payload.nonce, payload.cmd, err.code, err.message));
  }

  dispatch(
    nonce = null,
    cmd = APICommands.DISPATCH,
    evt = null,
    data = null
  ) {
    process.stdout.write(`${JSON.stringify({ cmd, data, evt, nonce })}\n`);
  }

  error(
    nonce = null,
    cmd = APICommands.DISPATCH,
    code = APIErrors.UNKNOWN_ERROR,
    message = 'Unknown Error'
  ) {
    this.dispatch(nonce, cmd, APIEvents.ERROR, { code, message });
  }

  start() {
    this.dispatch(null, APICommands.DISPATCH, APIEvents.READY, {
      v: 1,
      config: {
        cdn_host: this.client.options.http.cdn,
        api_endpoint: this.client.options.http.host,
        environment: process.env.NODE_ENV,
      },
    });
  }

  handleGlobalRejection() {} // eslint-disable-line no-empty-function
  handleGlobalException() {} // eslint-disable-line no-empty-function
}

module.exports = API;
