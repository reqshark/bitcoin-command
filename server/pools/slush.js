var BitcoinClient, async, config, request, run;

request = require('request-json');

async = require('async');

config = require('config');

BitcoinClient = require('bitcoin').Client;

run = function(pool, callback) {
  var bitcoin, client;
  client = request.newClient('https://mining.bitcoin.cz/');
  bitcoin = new BitcoinClient(config.bitcoin);
  return async.parallel({
    poolSize: function(callback) {
      return client.get("/stats/json/" + pool.apiKey, function(err, r, body) {
        var e, poolSize;
        if (err) {
          callback(err);
          return;
        }
        try {
          poolSize = Number(body.ghashes_ps) * 1000;
          return callback(null, poolSize);
        } catch (_error) {
          e = _error;
          return callback(e);
        }
      });
    },
    pending: function(callback) {
      return client.get("/accounts/profile/json/" + pool.apiKey, function(err, r, body) {
        var e;
        if (err) {
          callback(err);
          return;
        }
        try {
          return callback(null, Number(body.confirmed_reward) + Number(body.unconfirmed_reward));
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
    return callback({
      pending: data.pending,
      payouts: data.paid,
      poolSize: data.poolSize
    });
  });
};

exports.initialize = function(clients) {
  return clients.slush = run;
};
