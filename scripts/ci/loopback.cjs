'use strict';
/** Server-listen DNS adapter only. It performs no real resolver request. */
module.exports = function literalLoopbackLookup(deny) {
  return function lookup(hostname, options, callback) {
    if (hostname !== '127.0.0.1') return deny.apply(this, arguments);
    if (typeof options === 'function') { callback = options; options = {}; }
    if (typeof options === 'number') options = { family: options };
    if (!options || typeof options !== 'object' || typeof callback !== 'function' ||
        (options.family !== undefined && options.family !== 0 && options.family !== 4) ||
        (options.all !== undefined && typeof options.all !== 'boolean')) return deny.apply(this, arguments);
    process.nextTick(() => options.all ? callback(null, [{ address: '127.0.0.1', family: 4 }])
      : callback(null, '127.0.0.1', 4));
  };
};
