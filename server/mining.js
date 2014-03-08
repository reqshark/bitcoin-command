var BitcoinClient, anonymousChartCache, anonymousExpiration, async, authenticatedChartCache, authenticatedExpiration, config, db, io, moment, numTxt, url, _;

config = require('config');

async = require('async');

url = require('url');

moment = require('moment');

BitcoinClient = require('bitcoin').Client;

db = require('./db');

numTxt = require('./numberText');

io = require('./io');

_ = require('./underscore-plus');

anonymousChartCache = null;

anonymousExpiration = 0;

authenticatedChartCache = null;

authenticatedExpiration = 0;

exports.submitshare = function(req, res) {
  var body, device, pool, prefix, share, type;
  if (req.query.key !== config.submitShareKey) {
    res.statusCode = 401;
    res.send('Unauthorized');
    return;
  }
  body = req.body;
  if (!(body.hasOwnProperty('hostname') && body.hasOwnProperty('device') && body.hasOwnProperty('pool') && body.hasOwnProperty('result') && body.hasOwnProperty('shareHash') && body.hasOwnProperty('timestamp') && body.hasOwnProperty('targetDifficulty'))) {
    res.statusCode = 400;
    console.log("Invalid Share.");
    return res.send('Invalid share object');
  }
  share = {
    timestamp: body.timestamp,
    shareHash: body.shareHash,
    hostname: body.hostname.toLowerCase(),
    device: body.device.toLowerCase(),
    pool: body.pool.toLowerCase(),
    accepted: body.result === 'accept',
    targetDifficulty: body.targetDifficulty,
    shareDifficulty: body.shareDifficulty
  };
  db.shares.update({
    shareHash: share.shareHash
  }, share, {
    upsert: true
  });
  prefix = share.device.match(/^\D+/);
  if (prefix != null) {
    prefix = prefix[0];
  }
  prefix = prefix || '';
  type = (function() {
    switch (prefix) {
      case 'amu':
        return 'ASICMiner USB';
      case 'bas':
        return 'BFL Single SC';
      case 'baj':
        return 'BFL Jalapeno';
      case 'bitfury':
        return 'BitFury';
      default:
        return 'Unknown';
    }
  })();
  device = {
    hostname: share.hostname,
    device: share.device,
    type: type
  };
  db.devices.update({
    hostname: device.hostname,
    device: device.device
  }, {
    $setOnInsert: device
  }, {
    upsert: true
  });
  pool = {
    name: url.parse(share.pool).hostname,
    url: share.pool,
    enabled: true
  };
  db.pools.update({
    url: pool.url
  }, {
    $setOnInsert: pool
  }, {
    upsert: true
  });
  db.pools.findOne({
    url: pool.url
  }, function(err, pool) {
    var msg;
    msg = {
      hostname: share.hostname,
      device: share.device,
      pool: pool.name
    };
    io.http.sockets.emit('share', msg);
    if (io.https != null) {
      return io.https.sockets.emit('share', msg);
    }
  });
  return res.json({
    result: true
  });
};

exports.summarydata = function(req, res) {
  var client, cuttoff;
  cuttoff = moment().subtract('hours', 3).unix();
  client = new BitcoinClient(config.bitcoin);
  async.parallel({
    difficulty: function(callback) {
      return client.getDifficulty(callback);
    },
    poolInfo: function(callback) {
      return db.pools.find().toArray(callback);
    },
    deviceInfo: function(callback) {
      return db.devices.find().toArray(callback);
    },
    devices: function(callback) {
      var pipeline;
      pipeline = [
        {
          $match: {
            timestamp: {
              $gte: cuttoff
            }
          }
        }, {
          $sort: {
            timestamp: 1
          }
        }, {
          $project: {
            timestamp: 1,
            hostname: 1,
            device: 1,
            pool: 1,
            targetDifficulty: 1,
            acceptedDifficulty: {
              $cond: ['$accepted', '$targetDifficulty', 0]
            },
            rejectedDifficulty: {
              $cond: ['$accepted', 0, '$targetDifficulty']
            }
          }
        }, {
          $group: {
            _id: {
              hostname: '$hostname',
              device: '$device'
            },
            shares: {
              $sum: '$targetDifficulty'
            },
            accepted: {
              $sum: '$acceptedDifficulty'
            },
            rejected: {
              $sum: '$rejectedDifficulty'
            },
            lastPool: {
              $last: '$pool'
            },
            lastShare: {
              $last: '$timestamp'
            }
          }
        }, {
          $project: {
            _id: 0,
            hostname: '$_id.hostname',
            device: '$_id.device',
            hashrate: {
              $multiply: ['$shares', 0.397682157037037]
            },
            shares: 1,
            accepted: 1,
            rejected: 1,
            lastPool: 1,
            lastShare: 1
          }
        }
      ];
      return db.shares.aggregate(pipeline, callback);
    },
    pools: function(callback) {
      var pipeline;
      pipeline = [
        {
          $match: {
            timestamp: {
              $gte: cuttoff
            }
          }
        }, {
          $sort: {
            timestamp: 1
          }
        }, {
          $project: {
            timestamp: 1,
            pool: 1,
            targetDifficulty: 1,
            acceptedDifficulty: {
              $cond: ['$accepted', '$targetDifficulty', 0]
            },
            rejectedDifficulty: {
              $cond: ['$accepted', 0, '$targetDifficulty']
            }
          }
        }, {
          $group: {
            _id: '$pool',
            shares: {
              $sum: '$targetDifficulty'
            },
            accepted: {
              $sum: '$acceptedDifficulty'
            },
            rejected: {
              $sum: '$rejectedDifficulty'
            },
            lastShare: {
              $last: '$timestamp'
            }
          }
        }, {
          $project: {
            _id: 0,
            url: '$_id',
            hashrate: {
              $multiply: ['$shares', 0.397682157037037]
            },
            shares: 1,
            accepted: 1,
            rejected: 1,
            lastShare: 1
          }
        }
      ];
      return db.shares.aggregate(pipeline, callback);
    }
  }, function(err, results) {
    var counter, data, device, deviceInfo, id, p, pool, poolInfo, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3;
    if (err) {
      return res.json(err);
    }
    results.poolInfo = _.filter(results.poolInfo, function(item) {
      return item.enabled;
    });
    results.poolInfo = _.sortBy(results.poolInfo, function(item) {
      return item.name;
    });
    if (!req.authenticated) {
      counter = 1;
      _ref = results.poolInfo;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        p.name = "pool " + (numTxt.numberToText(counter++));
      }
    }
    poolInfo = _.toDictionary(results.poolInfo, 'url');
    deviceInfo = _.toDictionary(results.deviceInfo, function(d) {
      return "" + d.hostname + ":" + d.device;
    });
    results.pools = _.filter(results.pools, function(pool) {
      return poolInfo[pool.url];
    });
    data = {};
    data.totalHashrate = Number(_.reduce(results.devices, function(sum, device) {
      return sum + device.hashrate;
    }, 0).toFixed(0));
    data.expectedRate = (25 / results.difficulty) * 86400 * (data.totalHashrate * 1000000 / 4294967296) * 0.97;
    data.expectedRate = Number(data.expectedRate.toFixed(4));
    _ref1 = results.pools;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      pool = _ref1[_j];
      pool.name = poolInfo[pool.url].name;
      pool.payouts = poolInfo[pool.url].payouts;
      pool.pending = poolInfo[pool.url].pending;
      pool.poolSize = poolInfo[pool.url].poolSize;
      delete pool.url;
    }
    data.pools = _.sortBy(results.pools, function(item) {
      return item.name;
    });
    _ref2 = results.devices;
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      device = _ref2[_k];
      id = "" + device.hostname + ":" + device.device;
      device.lastPool = ((_ref3 = poolInfo[device.lastPool]) != null ? _ref3.name : void 0) || '';
      device.id = id;
      device.type = deviceInfo[id].type;
      device.status = deviceInfo[id].status;
      device.errors = deviceInfo[id].errors;
      device.temp = deviceInfo[id].temp;
    }
    data.devices = _.chain(results.devices).sortBy(function(item) {
      return item.id;
    }).groupBy('hostname').value();
    return res.json(data);
  });
};

exports.chartdata = function(req, res) {
  var end, histogram, start;
  if (req.authenticated && (authenticatedChartCache != null) && moment().unix() < authenticatedExpiration) {
    res.json(authenticatedChartCache);
    return;
  }
  if (!req.authenticated && anonymousChartCache && moment().unix() < anonymousExpiration) {
    res.json(anonymousChartCache);
    return;
  }
  end = moment().seconds(0).millisecond(0).subtract('minutes', 1).unix();
  start = end - (3600 * 24 * 3);
  histogram = {};
  db.pools.find({
    enabled: true
  }).toArray(function(err, pools) {
    var counter, p, _i, _len;
    if (err) {
      return res.json(err);
    }
    pools = _.sortBy(pools, function(item) {
      return item.name;
    });
    if (!req.authenticated) {
      counter = 1;
      for (_i = 0, _len = pools.length; _i < _len; _i++) {
        p = pools[_i];
        p.name = "pool " + (numTxt.numberToText(counter++));
      }
    }
    return async.each(pools, function(pool, callback) {
      var pipeline;
      pipeline = [
        {
          $match: {
            pool: pool.url,
            timestamp: {
              $gte: start,
              $lt: end
            }
          }
        }, {
          $project: {
            timeslot: {
              $subtract: [
                '$timestamp', {
                  $mod: [
                    {
                      $subtract: ['$timestamp', start]
                    }, 3600
                  ]
                }
              ]
            },
            targetDifficulty: 1
          }
        }, {
          $group: {
            _id: '$timeslot',
            shares: {
              $sum: '$targetDifficulty'
            }
          }
        }, {
          $project: {
            _id: 0,
            timeslot: '$_id',
            hashrate: {
              $multiply: ['$shares', 1.1930464711111111111111111111111]
            }
          }
        }, {
          $sort: {
            timeslot: 1
          }
        }
      ];
      return db.shares.aggregate(pipeline, function(err, results) {
        var buckets, entry, _j, _len1;
        if (err) {
          callback(err);
          return;
        }
        buckets = histogram[pool.name] = {};
        for (_j = 0, _len1 = results.length; _j < _len1; _j++) {
          entry = results[_j];
          buckets[entry.timeslot] = Number(entry.hashrate.toFixed(0));
        }
        return callback();
      });
    }, function(err) {
      var data, entry, i, name, pool, result, series, _j, _len1;
      if (err) {
        res.json(err);
        return;
      }
      series = [];
      for (_j = 0, _len1 = pools.length; _j < _len1; _j++) {
        pool = pools[_j];
        name = pool.name;
        data = [];
        entry = {
          name: name,
          data: data
        };
        series.push(entry);
        i = start;
        while (i < end) {
          data.push(histogram[name][i] || 0);
          i += 3600;
        }
      }
      result = {
        pointInterval: 3600000,
        pointStart: start * 1000,
        series: series
      };
      if (req.authenticated) {
        authenticatedChartCache = result;
        authenticatedExpiration = moment().add('minutes', 5).unix();
      } else {
        anonymousChartCache = result;
        anonymousExpiration = moment().add('minutes', 5).unix();
      }
      return res.json(result);
    });
  });
};
