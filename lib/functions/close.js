/**
 * @file lib/functions/close.js
 */
'use strict';

/**
 * Destroys remaining sockets to terminate active connections, then closes
 * the underlying HTTP server.
 * @return {Promise.<ServerObject>}
 * @this   {ServerObject}
 * @private
 */
module.exports = function close() {
  return new this.config.Promise((resolve) => {
    if (!this.instance.listening) {
      return resolve(this);
    }

    this.sockets.forEach((socket, uuid) => {
      socket.destroy();
      this.sockets.delete(uuid);
    });

    this.instance.close(() => {
      resolve(this);
    });
  });
};
