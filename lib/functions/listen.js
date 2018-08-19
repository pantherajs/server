/**
 * @file lib/functions/listen.js
 */
'use strict';

const uuid = require('uuid');

/**
 * Creates a new HTTP server, adding event handlers to the `request` and
 * `connection` events to toggle an `idle` flag on incoming Sockets and
 * destroy them if necessary. Resolves once the server is listening.
 * @param  {ServerObject}  server
 * @return {Promise.<ServerObject>}
 * @private
 */
module.exports = function listen(server) {
  return new server.config.Promise((resolve) => {
    if (server.instance.listening) {
      return resolve(server);
    }

    server.instance.on('request', (request, response) => {
      request.socket.idle = false;

      response.once('close', () => {
        request.socket.idle = true;

        if (!server.instance.listening) {
          request.socket.destroy();
        }
      });
    });

    server.instance.on('connection', (socket) => {
      socket.idle = true;
      socket.uuid = uuid.v4();

      server.sockets.set(socket.uuid, socket);

      socket.once('close', () => {
        server.sockets.delete(socket.uuid);
      });
    });

    server.instance.listen(server.config.port, () => {
      resolve(server);
    });
  });
};
