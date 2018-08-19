/**
 * @file test/functions/close.spec.js
 */
'use strict';

const sinon = require('sinon');
const test  = require('ava');

const close = require('../../lib/functions/close.js');

test('should resolve immediately if server is not listening', async t => {
  const server = {
    config: {
      Promise: Promise
    },
    instance: {
      listening: false
    }
  };

  const bound = close.bind(null, server);

  await t.notThrows(() => {
    bound();
  });
});

test('should destroy remaining sockets', async t => {
  const server = {
    config: {
      Promise: Promise
    },
    instance: {
      close:     cb => cb(),
      listening: true
    },
    sockets: new Map()
  };

  const bound  = close.bind(null, server);
  const socket = {
    destroy: sinon.stub()
  };

  server.sockets.set('uuid', socket);

  t.true(server.sockets.size === 1);

  await bound();

  t.true(socket.destroy.callCount === 1);
  t.true(server.sockets.size === 0);
});
