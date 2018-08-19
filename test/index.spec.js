/**
 * @file test/index.spec.js
 */
'use strict';

const proxyquire   = require('proxyquire');
const sinon        = require('sinon');
const test         = require('ava');

const stubs = {
  http: {
    createServer: () => sinon.stub().returns({})
  }
};

const server = proxyquire('../lib/index.js', stubs);

test('should return an object', t => {
  const instance = server({
    Promise: Promise
  });

  t.true(typeof instance === 'object');
});

test('should have `config`, `instance`, `sockets` properties', t => {
  const instance = server({
    Promise: Promise
  });

  [ 'config', 'instance', 'sockets' ].forEach((property) => {
    t.true(Object.prototype.hasOwnProperty.call(instance, property));
  });
});

test('should have `close`, `listen`, `restart` methods', t => {
  const instance = server({
    Promise: Promise
  });

  [ 'close', 'listen', 'restart' ].forEach((property) => {
    t.true(Object.prototype.hasOwnProperty.call(instance, property));
    t.true(typeof instance[property] === 'function');
  });
});
