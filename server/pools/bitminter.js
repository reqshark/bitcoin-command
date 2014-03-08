var BitcoinClient, async, config, request, run;

async = require('async');

config = require('config');

request = require('request-json');

BitcoinClient = require('bitcoin').Client;

run = function(pool, callback) {
  var bitcoin, client;
  client = request.newClient('https://bitminter.com/');
  bitcoin = new BitcoinClient(config.bitcoin);
  return async.parallel({
    poolSize: function(callback) {
      return client.get("/api/pool/stats", function(err, r, data) {
        var e, poolSize;
        if (err) {
          callback(err);
          return;
        }
        try {
          poolSize = Number(data.hash_rate);
          return callback(null, poolSize);
        } catch (_error) {
          e = _error;
          return callback(e);
        }
      });
    },
    pending: function(callback) {
      return client.get("/api/users?key=" + pool.apiKey, function(err, r, data) {
        var e;
        if (err) {
          callback(err);
          return;
        }
        try {
          return callback(null, Number(data.balances.BTC));
        } catch (_error) {
          e = _error;
          return callback(e);
        }
      });
    },
    paid: function(callback) {
      if (pool.payoutAddress != null) {
        return bitcoin.getReceivedByAddress(pool.payoutAddress, callback);
      } else {
        return callback(null, '');
      }
    }
  }, function(err, data) {
    if (err) {
      return;
    }
    console.log(data);
    return callback({
      pending: data.pending,
      payouts: data.paid,
      poolSize: data.poolSize
    });
  });
};

exports.initialize = function(clients) {
  return clients.bitminter = run;
};
