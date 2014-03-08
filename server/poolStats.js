var db, path, poolClients, updatePools;

path = require('path');

db = require('./db');

exports.initialize = function() {
  updatePools();
  return setInterval(updatePools, 300000);
};

poolClients = {};

require("fs").readdirSync(path.join(__dirname, 'pools')).forEach(function(file) {
  return require("./pools/" + file).initialize(poolClients);
});

updatePools = function() {
  db.pools.find({
    enabled: true
  }).toArray(function(err, pools) {
    var pool, _i, _len;
    if (err) {
      return;
    }
    for (_i = 0, _len = pools.length; _i < _len; _i++) {
      pool = pools[_i];
      if (pool.apiType) {
        (function(pool) {
          var _name;
          return typeof poolClients[_name = pool.apiType] === "function" ? poolClients[_name](pool, function(updates) {
            if (updates) {
              console.log("updated pool stats for " + pool.name);
              return db.pools.update({
                url: pool.url
              }, {
                $set: updates
              });
            }
          }) : void 0;
        })(pool);
      }
    }
  });
};
