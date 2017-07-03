const kCode = Symbol('code');
const assert = require('assert');
const util = require('util');
const { APIErrorsInternal } = require('../Constants');

const messages = new Map();

/**
 * API Error
 * @param {string} key Error key
 * @param {...*} [args] Arguments for this error
 */
class APIError extends Error {
  constructor(key, ...args) {
    super(message(key, args));
    this[kCode] = key;
    if (Error.captureStackTrace) Error.captureStackTrace(this, APIError);
  }

  get name() {
    return `${super.name} [${this[kCode]}]`;
  }

  get code() {
    return this[kCode];
  }
}

/**
 * Format the message for an error
 * @param {string} key Error key
 * @param {Array<*>} args Arguments to pass for util format or as function args
 * @returns {string} Formatted string
 */
function message(key, args) {
  const msg = messages.get(String(key));
  assert(msg, `An invalid error message key was used: ${key}.`);
  let fmt = util.format;
  if (typeof msg === 'function') {
    fmt = msg;
  } else {
    if (args === undefined || args.length === 0) return msg;
    args.unshift(msg);
  }
  return String(fmt(...args));
}

/**
 * Register an error code and message
 * @param {string} sym Unique name for the error
 * @param {*} val Value of the error
 */
function register(sym, val) {
  messages.set(sym, typeof val === 'function' ? val : String(val));
}

for (const [k, v] of Object.entries(APIErrorsInternal)) register(k, v);

module.exports = APIError;
