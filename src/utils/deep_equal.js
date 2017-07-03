function deepEqual(a, b) {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (!a || !b || (typeof a != 'object' && typeof b != 'object')) return a == b; // eslint-disable-line eqeqeq
  if (isUndefOrNull(a) || isUndefOrNull(b)) return false;
  if (a.prototype !== b.prototype) return false;
  if (a instanceof Buffer && b instanceof Buffer) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  let ka;
  let kb;
  try {
    ka = Object.keys(a);
    kb = Object.keys(b);
  } catch (e) {
    return false;
  }
  if (ka.length !== kb.length) return false;
  for (let i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i]) return false;
  }
  for (let i = ka.length - 1; i >= 0; i--) {
    let key = ka[i];
    if (!deepEqual(a[key], b[key])) return false;
  }
  return typeof a === typeof b;
}

function isUndefOrNull(value) {
  return value === null || value === undefined;
}

module.exports = deepEqual;
