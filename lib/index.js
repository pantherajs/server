/**
 * @file lib/index.js
 */
'use strict';

const http = require('http');
const uuid = require('uuid');

/**
 * An object literal encompassing an HTTP server created from a specified
 * callback function, a map of active Socket connections to the server, and
 * methods for starting, stopping, and restarting the base HTTP server.
 * @typedef ServerObject
 * @type {Object}
 * @property {Function}             close    - Closes the server
 * @property {Object}               config   - Server configuration
 * @property {http.Server}          instance - The underlying server
 * @property {Function}             listen   - Starts the server
 * @property {Function}             restart  - Restarts the server
 * @property {Map.<String, Socket>} sockets  - Maps UUIDs to Sockets
 */

/**
 * Creates an HTTP server based on a specified callback function that will
 * gracefully terminate active connections when it closes. All methods return
 * Promises that resolve to the wrapper upon success.
 * @param  {Function} callback  The callback function to use
 * @param  {Object}   [options] Server configuration
 * @return {ServerObject}
 */
module.exports = (callback, options) => {

  /**
   * Server configuration options.
   * @type {Object}
   * @property {Number}   port
   * @property {Function} Promise
   * @private
   */
  const config = Object.assign({
    Promise: Promise
  }, options)

  /**
   * The underlying server.
   * @type {http.Server}
   * @see {@link https://nodejs.org/api/http.html#http_class_http_server}
   * @private
   */
  const instance = http.createServer(callback);

  /**
   * A map of active Socket connections.
   * @type {Map.<String, Socket>}
   * @see {@link https://nodejs.org/api/http.html#http_message_socket}
   * @private
   */
  const sockets = new Map();

  /**
   * The above properties and below functions aggregated into a single object.
   * All Promises returned by the functions resolve to this; all internal
   * references to any of the properties or functions must use the
   * fully-qualified identifier name, i.e., `server.config.port`.
   * @type {ServerObject}
   * @public
   */
  const server = { close, config, instance, listen, restart, sockets };

  /**
   * Destroys remaining sockets to terminate active connections, then closes
   * the underlying HTTP server.
   * @return {Promise.<ServerObject>}
   * @private
   */
  function close() {
    return new config.Promise((resolve) => {
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

  /**
   * Creates a new HTTP server, adding event handlers to the `request` and
   * `connection` events to toggle an `idle` flag on incoming Sockets and
   * destroy them if necessary. Resolves once the server is listening.
   * @return {Promise.<ServerObject>}
   * @private
   */
  function listen() {
    return new config.Promise((resolve) => {
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

      server.instance.listen(config.port, () => {
        resolve(server);
      });
    });
  };

  /**
   * Restarts the server. Calls `#close`, then `#listen`.
   * @return {Promise.<ServerObject>}
   * @private
   */
  function restart() {
    return server.close().then(server.listen);
  };

  return server;
};
