// Node.js 25.2.0 workaround: Polyfill localStorage before jest-environment-node initialization
try { globalThis.localStorage; } catch (e) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      _data: {},
      setItem(k, v) { this._data[k] = String(v); },
      getItem(k) { return this._data[k] ?? null; },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; },
      get length() { return Object.keys(this._data).length; },
      key(i) { return Object.keys(this._data)[i] ?? null; },
    },
    writable: true,
    configurable: true,
  });
}

module.exports = require('jest-environment-node').TestEnvironment;
