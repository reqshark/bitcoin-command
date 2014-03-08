var CGMinerClient, async, db, updateDevices, _;

CGMinerClient = require('cgminer');

async = require('async');

_ = require('./underscore-plus');

db = require('./db');

exports.initialize = function() {
  setInterval(updateDevices, 30000);
  return updateDevices();
};

CGMinerClient.prototype._devdetails = function(r) {
  return r.DEVDETAILS;
};

updateDevices = function() {
  return db.devices.distinct('hostname', function(err, hostnames) {
    var hostname, port, _i, _len, _results;
    if (err) {
      return;
    }
    _results = [];
    for (_i = 0, _len = hostnames.length; _i < _len; _i++) {
      hostname = hostnames[_i];
      _results.push((function() {
        var _j, _results1;
        _results1 = [];
        for (port = _j = 4028; _j <= 4034; port = ++_j) {
          _results1.push((function(hostname, port) {
            var client;
            client = new CGMinerClient({
              host: hostname,
              port: port
            });
            return async.parallel({
              devs: function(callback) {
                return client.devs().then(function(results) {
                  return callback(null, results);
                }, function(err) {
                  return callback(err);
                });
              },
              devdetails: function(callback) {
                return client.devdetails().then(function(results) {
                  return callback(null, results);
                }, function(err) {
                  return callback(err);
                });
              }
            }, function(err, results) {
              var accepted, devdetails, devs, errors, hw, key, rejected, status, temp, total;
              if (err) {
                return;
              }
              devs = _.toDictionary(results.devs, function(item) {
                if (item.GPU != null) {
                  return "gpu" + item.GPU;
                }
                return "" + (item.Name.toLowerCase()) + item.ID;
              });
              devdetails = _.toDictionary(results.devdetails, function(item) {
                return "" + (item.Name.toLowerCase()) + item.ID;
              });
              for (key in devs) {
                hw = devs[key]['Hardware Errors'];
                accepted = devs[key]['Difficulty Accepted'];
                rejected = devs[key]['Difficulty Rejected'];
                errors = 0;
                if (hw && (accepted != null) && (rejected != null)) {
                  total = hw + accepted + rejected;
                  if (total > 0) {
                    errors = Number((100 * hw / total).toFixed(2));
                  }
                }
                status = devs[key]['Status'];
                temp = devs[key]['Temperature'];
                db.devices.update({
                  hostname: hostname,
                  device: key
                }, {
                  $set: {
                    status: status,
                    temp: temp,
                    errors: errors
                  }
                });
              }
              return console.log("updated cgminer stats for " + hostname + ":" + port);
            });
          })(hostname, port));
        }
        return _results1;
      })());
    }
    return _results;
  });
};
