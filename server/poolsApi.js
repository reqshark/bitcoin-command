var BSON, db, _;

db = require('./db');

BSON = require('mongodb').BSONPure;

_ = require('./underscore-plus');

exports.getAllPools = function(req, res) {
  return db.pools.find().toArray(function(err, data) {
    if (err) {
      throw err;
    }
    _.each(data, function(pool) {
      pool.id = pool._id;
      return delete pool._id;
    });
    return res.json(data);
  });
};

exports.getPool = function(req, res) {
  var id;
  id = new BSON.ObjectID(req.params.poolId);
  return db.pools.findOne({
    _id: id
  }, function(err, pool) {
    if (err) {
      throw err;
    }
    if (pool == null) {
      res.statusCode = 404;
      res.json({
        error: 'pool not found'
      });
      return;
    }
    pool.id = pool._id;
    delete pool._id;
    return res.json(pool);
  });
};

exports.savePool = function(req, res) {
  var id, pool;
  pool = req.body;
  id = new BSON.ObjectID(req.params.poolId);
  delete pool.id;
  delete pool._id;
  delete pool.poolSize;
  delete pool.pending;
  delete pool.payouts;
  return db.pools.update({
    _id: id
  }, {
    $set: pool
  }, {
    w: 1
  }, function(err) {
    if (err) {
      res.statusCode = 500;
      res.json({
        error: err
      });
    }
    return res.end();
  });
};

exports.deletePool = function(req, res) {
  var id;
  id = new BSON.ObjectID(req.params.poolId);
  return db.pools.remove({
    _id: id
  }, {
    w: 1
  }, function(err) {
    if (err) {
      res.statusCode = 500;
      res.json({
        error: err
      });
    }
    return res.end();
  });
};
