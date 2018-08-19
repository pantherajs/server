/**
 * @file lib/functions/restart.js
 */
'use strict';

/**
 * Restarts the server. Calls `#close`, then `#listen`.
 * @param  {ServerObject} server
 * @return {Promise.<ServerObject>}
 * @private
 */
module.exports = function restart(server) {
  return server.close().then(server.listen);
};
