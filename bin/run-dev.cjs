#!/usr/bin/env node

const { register } = require('tsx/cjs/api');

const unregister = register();

try {
  require('../src/index.ts');
} finally {
  if (typeof unregister === 'function') {
    unregister();
  }
}
