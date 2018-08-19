/**
 * @file test/functions/listen.spec.js
 */
'use strict';

const EventEmitter = require('events');
const proxyquire   = require('proxyquire');
const test         = require('ava');

const stubs = {
  uuid: {
    v4: () => 'uuid'
  }
};

const close  = require('../../lib/functions/close.js');
const listen = proxyquire('../../lib/functions/listen.js', stubs);

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

test('#listen should resolve immediately if server is already listening', async t => {
  const server = {
    config: {
      Promise: Promise
    },
    instance: {
      listening: true
    }
  };

  const bound = listen.bind(server);

  await t.notThrows(() => {
    bound();
  });
});

test('request sockets should have idle flag set to `false`', async t => {
  const server = {
    config: {
      Promise: Promise
    },
    instance: new Server(),
    sockets:  new Map()
  };

  const bound = listen.bind(server);

  await t.notThrows(() => {
    bound();
  });

  const request  = new Request();
  const response = new Response();

  server.instance.emit('connection', request.socket);
  server.instance.emit('request', request, response);

  t.false(request.socket.idle);
});

test('completed responses should set socket idle flag to `true`', async t => {
  const server = {
    config: {
      Promise: Promise
    },
    instance: new Server(),
    sockets:  new Map()
  };

  const bound = listen.bind(server);

  await t.notThrows(() => {
    bound();
  });

  const request  = new Request();
  const response = new Response();

  server.instance.emit('connection', request.socket);
  server.instance.emit('request', request, response);

  t.false(request.socket.idle);

  response.emit('close');

  t.true(request.socket.idle);
});

test('completed responses should destroy socket if server is not listening', async t => {
  const server = {
    config: {
      Promise: Promise
    },
    instance: new Server(),
    sockets:  new Map()
  };

  const boundListen = listen.bind(server);
  const boundClose  = close.bind(server);

  await t.notThrows(() => {
    boundListen();
  });

  const request  = new Request();
  const response = new Response();

  server.instance.emit('connection', request.socket);
  server.instance.emit('request', request, response);

  await t.notThrows(() => {
    boundClose();
  });

  t.false(request.socket.idle);

  response.emit('close');

  t.true(request.socket.idle);
});


test('connecting sockets should have idle flag set to `true`', async t => {
  const server = {
    config: {
      Promise: Promise
    },
    instance: new Server(),
    sockets:  new Map()
  };

  const bound = listen.bind(server);

  await t.notThrows(() => {
    bound();
  });

  const socket = new Socket();

  server.instance.emit('connection', socket);

  t.true(socket.idle);
});


test('connecting sockets should have uuid set', async t => {
  const server = {
    config: {
      Promise: Promise
    },
    instance: new Server(),
    sockets:  new Map()
  };

  const bound = listen.bind(server);

  await t.notThrows(() => {
    bound();
  });

  const socket = new Socket();

  server.instance.emit('connection', socket);

  t.true(socket.uuid === 'uuid');
});

test('connecting sockets should be added to map of sockets', async t => {
  const server = {
    config: {
      Promise: Promise
    },
    instance: new Server(),
    sockets:  new Map()
  };

  const bound = listen.bind(server);

  await t.notThrows(() => {
    bound();
  });

  const socket = new Socket();

  t.true(server.sockets.size === 0);

  server.instance.emit('connection', socket);

  t.true(server.sockets.size === 1);
  t.true(server.sockets.get('uuid') === socket);
});
