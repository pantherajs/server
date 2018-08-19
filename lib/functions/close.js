/**
 * @file lib/functions/close.js
 */
'use strict';

/**
 * Destroys remaining sockets to terminate active connections, then closes
 * the underlying HTTP server.
 * @param  {ServerObject} server
 * @return {Promise.<ServerObject>}
 * @private
 */
module.exports = function close(server) {
  return new server.config.Promise((resolve) => {
    if (!server.instance.listening) {
      return resolve(server);
    }

    server.sockets.forEach((socket, uuid) => {
      socket.destroy();
      server.sockets.delete(uuid);
    });

    server.instance.close(() => {
      resolve(server);
    });
  });
};
