/**
 * @file test/index.spec.js
 */
'use strict';

const EventEmitter = require('events');
const proxyquire   = require('proxyquire');
const sinon        = require('sinon');
const test         = require('ava');

class Server extends EventEmitter {
  constructor() {
    super();
    this.listening = false;
  }

  listen(port, cb) {
    this.listening = true;
    this.on('listening', cb);
    this.emit('listening');
  }

  close(cb) {
    this.listening = false;
    this.on('close', cb);
    this.emit('close');
  }
};

class Request extends EventEmitter {
  constructor() {
    super();
    this.socket = new Socket();
  }
};

class Response extends EventEmitter {
  end() {}
  setHeader() {}
};

class Socket extends EventEmitter {
  constructor() {
    super();
    this._handle = {};
  }
  setTimeout() {}
  destroy() {
    this.emit('close');
  }
};

const stubs = {
  http: {
    createServer: (cb) => new Server(cb)
  },
  uuid: {
    v4: () => 'uuid'
  }
};

const server = proxyquire('../lib/index.js', stubs);

test('#close should resolve immediately if server is not listening', async t => {
  const instance = server(() => {});
  await t.notThrows(() => {
    instance.close();
  });
});

test('#close should destroy remaining sockets', async t => {
  const instance = server(() => {});
  await instance.listen();

  const socket = new Socket();

  sinon.spy(socket, 'destroy');
  instance.sockets.set('uuid', socket);

  t.true(instance.sockets.size === 1);

  await instance.close();

  t.true(socket.destroy.callCount === 1);
  t.true(instance.sockets.size === 0);
});

test('#listen should resolve immediately if server is already listening', async t => {
  const instance = server(() => {});
  await instance.listen();

  await t.notThrows(() => {
    instance.listen();
  });
});

test('request sockets should have idle flag set to `false`', async t => {
  const instance = server(()=> {});
  await instance.listen();

  const request  = new Request();
  const response = new Response();

  instance.instance.emit('connection', request.socket);
  instance.instance.emit('request', request, response);

  t.false(request.socket.idle);

  await instance.close();
});

test('completed responses should set socket idle flag to `true`', async t => {
  const instance = server(()=> {});
  await instance.listen();

  const request  = new Request();
  const response = new Response();

  instance.instance.emit('connection', request.socket);
  instance.instance.emit('request', request, response);

  t.false(request.socket.idle);

  response.emit('close');

  t.true(request.socket.idle);

  await instance.close();
});

test('completed responses should destroy socket if server is not listening', async t => {
  const instance = server(()=> {});
  await instance.listen();

  const request  = new Request();
  const response = new Response();

  instance.instance.emit('connection', request.socket);
  instance.instance.emit('request', request, response);

  await instance.close();

  t.false(request.socket.idle);

  response.emit('close');

  t.true(request.socket.idle);
});

test('connecting sockets should have idle flag set to `true`', async t => {
  const instance = server(()=> {});
  await instance.listen();

  const socket = new Socket();

  instance.instance.emit('connection', socket);

  t.true(socket.idle);
});

test('connecting sockets should have uuid set', async t => {
  const instance = server(()=> {});
  await instance.listen();

  const socket = new Socket();

  instance.instance.emit('connection', socket);

  t.true(socket.uuid === 'uuid');
});

test('connecting sockets should be added to map of sockets', async t => {
  const instance = server(()=> {});
  await instance.listen();

  const socket = new Socket();

  t.true(instance.sockets.size === 0);

  instance.instance.emit('connection', socket);

  t.true(instance.sockets.size === 1);
  t.true(instance.sockets.get('uuid') === socket);
});

test('#restart should call #close, then #listen', async t => {
  const instance = server(() => {});
  
  sinon.spy(instance, 'close');
  sinon.spy(instance, 'listen');

  await t.notThrows(() => {
    instance.restart();
  });

  t.true(instance.close.callCount === 1);
  t.true(instance.listen.callCount === 1);
});
