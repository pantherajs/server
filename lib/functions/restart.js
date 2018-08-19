/**
 * @file lib/functions/restart.js
 */
'use strict';

/**
 * Restarts the server. Calls `#close`, then `#listen`.
 * @return {Promise.<ServerObject>}
 * @this   {ServerObject}
 * @private
 */
module.exports = function restart() {
  return this.close().then(this.listen);
};
