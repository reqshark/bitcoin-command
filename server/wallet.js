var BitcoinClient, async, config, db, defaultNumberOfTransactions, getAddressPreferences, lastPrice, lastPriceExpiration, moment, request, _;

config = require('config');

async = require('async');

BitcoinClient = require('bitcoin').Client;

moment = require('moment');

request = require('request-json');

_ = require('./underscore-plus');

db = require('./db');

defaultNumberOfTransactions = 50;

getAddressPreferences = function(callback) {
  db.addresses.find().toArray(function(err, addresses) {
    var preferences;
    if (err) {
      callback(err);
      return;
    }
    preferences = _.toDictionary(addresses, function(a) {
      return a.address;
    });
    callback(null, preferences);
  });
};

exports.summary = function(req, res) {
  var client, show;
  client = new BitcoinClient(config.bitcoin);
  show = req.query.show;
  if (show === 'all') {
    show = 1000000;
  }
  show = Number(show);
  if (isNaN(show) || show < 1) {
    show = defaultNumberOfTransactions;
  }
  return async.parallel({
    preferences: function(callback) {
      return getAddressPreferences(callback);
    },
    balance: function(callback) {
      return client.getBalance(callback);
    },
    transactions: function(callback) {
      return client.listTransactions('*', Math.max(show + 1, 100), callback);
    },
    pools: function(callback) {
      return db.pools.find({}, {
        name: 1,
        payoutAliases: 1
      }).toArray(callback);
    },
    savings: function(callback) {
      var pipeline;
      pipeline = [
        {
          $group: {
            _id: '',
            total: {
              $sum: '$value'
            }
          }
        }
      ];
      return db.savings.aggregate(pipeline, callback);
    }
  }, function(err, result) {
    var cutoff, data, oldest, poolAccounts, poolEarnings, preferences, tx, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4;
    if (err) {
      return res.json(err);
    }
    preferences = result.preferences;
    data = {};
    result.transactions.reverse();
    data.balance = result.balance;
    data.savings = (_ref = result.savings) != null ? (_ref1 = _ref[0]) != null ? _ref1.total : void 0 : void 0;
    poolAccounts = _.reduce(result.pools, function(dict, pool) {
      var alias, _i, _len, _ref2;
      dict[pool.name] = true;
      if (pool.payoutAliases != null) {
        _ref2 = pool.payoutAliases.split(',');
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          alias = _ref2[_i];
          dict[alias] = true;
        }
      }
      return dict;
    }, {});
    poolEarnings = 0;
    oldest = moment().unix();
    cutoff = moment().subtract('days', 7).unix();
    _ref2 = result.transactions;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      tx = _ref2[_i];
      if (((_ref3 = tx.category) === 'receive' || _ref3 === 'generate' || _ref3 === 'immature') && ((_ref4 = preferences[tx.address]) != null ? _ref4.label : void 0)) {
        tx.account = preferences[tx.address].label;
      }
      if (tx.time >= cutoff) {
        if (tx.time < oldest) {
          oldest = tx.time;
        }
        if (tx.amount > 0 && poolAccounts[tx.account]) {
          poolEarnings += tx.amount;
        }
      }
    }
    data.earnRate = Number((poolEarnings / 7).toFixed(4));
    data.more = result.transactions.length > show ? true : false;
    data.transactions = _.chain(result.transactions).first(show).map(function(tx) {
      var confirmCount;
      if (tx.category === 'generate' || tx.category === 'immature') {
        confirmCount = 120;
      } else {
        confirmCount = 6;
      }
      tx.confirmed = tx.confirmations >= confirmCount ? true : false;
      return tx;
    }).value();
    return res.json(data);
  });
};

lastPrice = '-';

lastPriceExpiration = 0;

exports.price = function(req, res) {
  var client;
  if (moment().unix() < lastPriceExpiration) {
    return res.json({
      usd: lastPrice
    });
  }
  client = request.newClient('https://coinbase.com/');
  return client.get('/api/v1/prices/sell', function(err, r, body) {
    if (!err) {
      lastPrice = Number(body.subtotal.amount);
      lastPriceExpiration = moment().add('seconds', 60).unix();
    }
    return res.json({
      usd: lastPrice
    });
  });
};

exports.recentRecipients = function(req, res) {
  var client;
  client = new BitcoinClient(config.bitcoin);
  return client.listTransactions('*', 500, function(err, transactions) {
    var addresses;
    if (err) {
      return res.json(err);
    }
    transactions.reverse();
    addresses = _.chain(transactions).filter(function(tx) {
      return tx.category === 'send' && (tx.to != null);
    }).uniq(false, function(tx) {
      return tx.address;
    }).sortBy(function(tx) {
      return tx.to.toLowerCase();
    }).map(function(tx) {
      return {
        name: tx.to,
        address: tx.address
      };
    }).value();
    return res.json(addresses);
  });
};

exports.sendTx = function(req, res) {
  var client, tx, _ref, _ref1;
  client = new BitcoinClient(config.bitcoin);
  tx = req.body;
  if (!(((_ref = tx.passphrase) != null ? _ref.length : void 0) > 0 && tx.amount > 0 && ((_ref1 = tx.address) != null ? _ref1.length : void 0) > 0 && isFinite(tx.amount))) {
    res.statusCode = 400;
    res.json({
      error: 'Error: Invalid parameters'
    });
  }
  return async.parallel({
    validAddress: function(callback) {
      return client.validateAddress(tx.address, callback);
    },
    balance: function(callback) {
      return client.getBalance(callback);
    },
    unlock: function(callback) {
      return client.walletPassphrase(tx.passphrase, 30, callback);
    }
  }, function(err, result) {
    var error, _ref2, _ref3, _ref4;
    if (err) {
      error = err.message;
    }
    if (!((_ref2 = result.validAddress) != null ? _ref2.isvalid : void 0)) {
      error = "Error: Invalid Bitcoin Address";
    }
    if (tx.amount > result.balance) {
      error = 'Error: Insufficient Funds';
    }
    if (error != null) {
      res.statusCode = 400;
      res.json({
        error: error
      });
      return;
    }
    client.sendToAddress(tx.address, Number(tx.amount), (_ref3 = tx.comment) != null ? _ref3 : '', (_ref4 = tx.name) != null ? _ref4 : '', function(err, result) {
      client.walletLock();
      if (err) {
        res.statusCode = 500;
        res.json({
          error: err.message
        });
        return;
      }
      res.statusCode = 200;
      return res.json({
        success: true
      });
    });
  });
};

exports.signMsg = function(req, res) {
  var client, msg, _ref, _ref1;
  client = new BitcoinClient(config.bitcoin);
  msg = req.body;
  if (!(((_ref = msg.passphrase) != null ? _ref.length : void 0) > 0 && ((_ref1 = msg.address) != null ? _ref1.length : void 0) > 0)) {
    res.statusCode = 400;
    res.json({
      error: 'Error: Invalid parameters'
    });
  }
  return async.parallel({
    validAddress: function(callback) {
      return client.validateAddress(msg.address, callback);
    },
    unlock: function(callback) {
      return client.walletPassphrase(msg.passphrase, 30, callback);
    }
  }, function(err, result) {
    var error, _ref2;
    if (err) {
      error = err.message;
    }
    if (!((_ref2 = result.validAddress) != null ? _ref2.isvalid : void 0)) {
      error = "Error: Invalid Bitcoin Address";
    }
    if (error != null) {
      res.statusCode = 400;
      res.json({
        error: error
      });
      return;
    }
    client.signMessage(msg.address, msg.message, function(err, result) {
      client.walletLock();
      if (err) {
        res.statusCode = 500;
        res.json({
          error: err.message
        });
        return;
      }
      res.statusCode = 200;
      return res.json({
        success: true,
        signature: result
      });
    });
  });
};

exports.listAddresses = function(req, res) {
  var client;
  client = new BitcoinClient(config.bitcoin);
  return async.parallel({
    addresses: function(callback) {
      return async.waterfall([
        function(callback) {
          return client.listAccounts(0, callback);
        }, function(accountList, callback) {
          var addresses;
          addresses = [];
          return async.eachLimit(_.keys(accountList), 6, function(account, callback) {
            if (account.length > 0) {
              return client.getAddressesByAccount(account, function(err, result) {
                var address, _i, _len;
                if (!err) {
                  for (_i = 0, _len = result.length; _i < _len; _i++) {
                    address = result[_i];
                    addresses.push({
                      label: account,
                      address: address
                    });
                  }
                }
                return callback(err);
              });
            } else {
              return callback();
            }
          }, function(err) {
            return callback(err, addresses);
          });
        }
      ], callback);
    },
    preferences: function(callback) {
      return getAddressPreferences(callback);
    }
  }, function(err, data) {
    var addresses, entry, preferences, _i, _len, _ref, _ref1, _ref2, _ref3;
    if (err) {
      res.statusCode = 500;
      res.json(err);
    }
    preferences = data.preferences;
    _ref = data.addresses;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entry = _ref[_i];
      entry.archived = ((_ref1 = preferences[entry.address]) != null ? _ref1.archived : void 0) ? true : false;
      entry.label = (_ref2 = (_ref3 = preferences[entry.address]) != null ? _ref3.label : void 0) != null ? _ref2 : entry.label;
    }
    addresses = _.sortBy(data.addresses, function(a) {
      return a.label.toLocaleLowerCase();
    });
    return res.json(addresses);
  });
};

exports.updateAddress = function(req, res) {
  var body, entry;
  body = req.body;
  if (body.address == null) {
    res.statusCode = 400;
    res.json({
      error: 'Invalid request'
    });
    return;
  }
  entry = {
    address: body.address,
    label: body.label,
    archived: body.archived ? true : false
  };
  db.addresses.update({
    address: entry.address
  }, entry, {
    upsert: true
  });
  return res.json(entry);
};

exports.newAddress = function(req, res) {
  var body, client;
  body = req.body;
  if (body.label == null) {
    res.statusCode = 400;
    res.json({
      error: 'Invalid request'
    });
    return;
  }
  client = new BitcoinClient(config.bitcoin);
  client.getNewAddress(body.label, function(err, address) {
    if (err) {
      res.statusCode = 500;
      res.json({
        error: err
      });
    }
    res.json({
      address: address
    });
  });
};
