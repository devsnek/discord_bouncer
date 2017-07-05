const EventEmitter = require('events');
const joi = require('joi');
const APICommandHandlers = require('./APICommands');
const APIEventHandlers = require('./APIEvents');
const APIError = require('./APIError');
const deepEqual = require('../utils/deep_equal');
const { containsFilteredValues } = require('./APIHelpers');
const djsBind = require('./DJSBind');
const {
  APIErrors,
  APIEvents,
  APICommands,
} = require('../Constants');

class MockAPI extends EventEmitter {
  constructor({ client }) {
    super();
    this.client = client;
    this.commands = APICommandHandlers;
    this.events = APIEventHandlers;
    this.subscriptions = new Set();
    djsBind({ server: this, client });
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
    this.emit('out', { cmd, data, evt, nonce, interface: 'mock' });
    return this;
  }

  error(
    nonce = null,
    cmd = APICommands.DISPATCH,
    code = APIErrors.UNKNOWN_ERROR,
    message = 'Unknown Error'
  ) {
    this.dispatch(nonce, cmd, APIEvents.ERROR, { code, message });
    return this;
  }

  start() {
    this.dispatch(null, APICommands.DISPATCH, APIEvents.READY, {
      v: 1,
      config: {
        cdn_host: this.client.options.http.cdn.replace('https://', ''),
        api_endpoint: this.client.options.http.api,
        environment: process.env.NODE_ENV,
      },
    });
    return Promise.resolve(this);
  }

  addSubscription(evt, args) {
    const dispatch = this.dispatch.bind(this, null, APICommands.DISPATCH, evt);

    if (this.getSubscription(evt, args)) return;

    return this.subscriptions.add({
      dispatch,
      evt,
      args,
    });
  }

  removeSubscription(evt, args) {
    const current = this.getSubscription(evt, args);
    return this.subscriptions.delete(current);
  }

  getSubscription(evt, args) {
    return Array.from(this.subscriptions).find((s) =>
      s.evt === evt && deepEqual(s.args, args));
  }

  dispatchToSubscriptions(evt, data) {
    this.subscriptions.forEach((s) => {
      if (s.evt !== evt || !containsFilteredValues(data, s.args)) return;
      s.dispatch(data);
    });
    return this;
  }

  globalRejection(_, err) {
    this.error(null, null, err.code, err.message);
  }
  globalException(err) {
    this.error(null, null, err.code, err.message);
  }
}

module.exports = MockAPI;
