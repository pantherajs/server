/**
 * @file lib/functions/listen.js
 */
'use strict';

const uuid = require('uuid');

/**
 * Creates a new HTTP server, adding event handlers to the `request` and
 * `connection` events to toggle an `idle` flag on incoming Sockets and
 * destroy them if necessary. Resolves once the server is listening.
 * @return {Promise.<ServerObject>}
 * @this   {ServerObject}
 * @private
 */
module.exports = function listen() {
  return new this.config.Promise((resolve) => {
    if (this.instance.listening) {
      return resolve(this);
    }

    this.instance.on('request', (request, response) => {
      request.socket.idle = false;

      response.once('close', () => {
        request.socket.idle = true;

        if (!this.instance.listening) {
          request.socket.destroy();
        }
      });
    });

    this.instance.on('connection', (socket) => {
      socket.idle = true;
      socket.uuid = uuid.v4();

      this.sockets.set(socket.uuid, socket);

      socket.once('close', () => {
        this.sockets.delete(socket.uuid);
      });
    });

    this.instance.listen(this.config.port, () => {
      resolve(this);
    });
  });
};
