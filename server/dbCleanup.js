var cleanUp, db, moment;

moment = require('moment');

db = require('./db');

exports.initialize = function() {
  setInterval(cleanUp, 300000);
  return cleanUp();
};

cleanUp = function() {
  var cutoff;
  cutoff = moment().subtract('days', 3).subtract('hours', 1).unix();
  return db.shares.remove({
    timestamp: {
      $lt: cutoff
    }
  }, {
    w: 1
  }, function(err, count) {
    if (err) {
      return;
    }
    return console.log("Removed " + count + " shares older than " + (moment.unix(cutoff).format('lll')));
  });
};
