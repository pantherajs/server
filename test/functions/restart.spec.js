/**
 * @file test/functions/restart.spec.js
 */
'use strict';

const sinon = require('sinon');
const test  = require('ava');

const restart = require('../../lib/functions/restart.js');

test('should call #close, then #listen', async t => {
  const server = {};

  server.close  = sinon.stub().resolves(server);
  server.listen = sinon.stub().resolves(server);

  const bound = restart.bind(null, server);

  await t.notThrows(() => {
    bound();
  });

  t.true(server.close.callCount === 1);
  t.true(server.listen.callCount === 1);
});
