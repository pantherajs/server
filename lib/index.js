/**
 * @file lib/index.js
 */
'use strict';

const http = require('http');

const close   = require('./functions/close');
const listen  = require('./functions/listen');
const restart = require('./functions/restart');

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
  }, options);

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
   * The above properties and bound functions aggregated into a single object.
   * @type {ServerObject}
   * @public
   */
  const server = { config, instance, sockets };

  server.close   = close.bind(null, server);
  server.listen  = listen.bind(null, server);
  server.restart = restart.bind(null, server);

  return server;
};
