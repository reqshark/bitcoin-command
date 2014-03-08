var BitcoinClient, async, config, request, run;

request = require('request-json');

async = require('async');

config = require('config');

BitcoinClient = require('bitcoin').Client;

run = function(pool, callback) {
  var bitcoin, client;
  client = request.newClient('http://eligius.st/');
  bitcoin = new BitcoinClient(config.bitcoin);
  return async.parallel({
    poolSize: function(callback) {
      return client.get("/~luke-jr/raw/7/cppsrb.json", function(err, r, body) {
        var e, poolSize;
        if (err) {
          callback(err);
          return;
        }
        try {
          poolSize = Number(body[''].shares['256']) * 16777216 / 1000000;
          return callback(null, poolSize);
        } catch (_error) {
          e = _error;
          return callback(e);
        }
      });
    },
    balances: function(callback) {
      return client.get("/~luke-jr/raw/7/balances.json", function(err, r, body) {
        var balances, e;
        if (err) {
          callback(err);
          return;
        }
        try {
          balances = {
            paid: body[pool.apiKey].everpaid / 100000000,
            pending: body[pool.apiKey].balance / 100000000
          };
          return callback(null, balances);
        } catch (_error) {
          e = _error;
          return callback(e);
        }
      });
    }
  }, function(err, data) {
    if (err) {
      return;
    }
    return callback({
      pending: data.balances.pending,
      payouts: data.balances.paid,
      poolSize: data.poolSize
    });
  });
};

exports.initialize = function(clients) {
  return clients.eligius = run;
};
