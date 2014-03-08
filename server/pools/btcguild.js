var request, run;

request = require('request-json');

run = function(pool, callback) {
  var client;
  client = request.newClient('https://www.btcguild.com/');
  return client.get("/api.php?api_key=" + pool.apiKey, function(err, r, body) {
    var e, payouts, pending, poolSize;
    if (err) {
      return;
    }
    try {
      pending = body.user.unpaid_rewards;
      payouts = body.user.paid_rewards;
      poolSize = body.pool.pool_speed * 1000;
      return callback({
        pending: pending,
        payouts: payouts,
        poolSize: poolSize
      });
    } catch (_error) {
      e = _error;
    }
  });
};

exports.initialize = function(clients) {
  return clients.btcguild = run;
};
