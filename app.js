var app, async, config, db, dbCleanup, debug, deviceStats, express, fs, http, https, io, mining, noCache, path, poolStats, pools, security, step, wallet;

express = require('express');
http = require('http');
https = require('https');
fs = require('fs');
path = require('path');
step = require('step');
async = require('async');
config = require('config');
db = require('./server/db');
security = require('./server/security');
mining = require('./server/mining');
wallet = require('./server/wallet');
pools = require('./server/poolsApi');
poolStats = require('./server/poolStats');
deviceStats = require('./server/deviceStats');
dbCleanup = require('./server/dbCleanup');
io = require('./server/io');

noCache = function(req, res, next) {
  res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate');
  return next();
};

app = express();
app.set("port", Number(config.port || 3000));
app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');
app.use(express.favicon('public/favicon.ico'));
app.use(express.logger("dev"));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.query());
app.use(security.authParser());
app.use(express.compress());
app.use(express['static'](path.join(__dirname, "public")));
app.use(app.router);
app.use(express.errorHandler());
app.post('/submitshare', noCache, mining.submitshare);
app.get('/mining/summary', noCache, security.requireAuthentication, mining.summarydata);
app.get('/mining/chart', noCache, security.requireAuthentication, mining.chartdata);
app.get('/wallet/summary', noCache, security.requireAuthentication, wallet.summary);
app.get('/wallet/price', noCache, security.requireAuthentication, wallet.price);
app.get('/wallet/recentRecipients', noCache, security.requireAuthentication, wallet.recentRecipients);
app.post('/wallet/send', noCache, security.requireAuthentication, wallet.sendTx);
app.post('/wallet/sign', noCache, security.requireAuthentication, wallet.signMsg);
app.get('/wallet/addresses', noCache, security.requireAuthentication, wallet.listAddresses);
app.post('/wallet/addresses', noCache, security.requireAuthentication, wallet.updateAddress);
app.post('/wallet/newaddress', noCache, security.requireAuthentication, wallet.newAddress);
app.get('/pools', noCache, security.requireAuthentication, pools.getAllPools);
app.post('/pools/:poolId', noCache, security.requireAuthentication, pools.savePool);
app["delete"]('/pools/:poolId', noCache, security.requireAuthentication, pools.deletePool);
app.get('/pools/:poolId', noCache, security.requireAuthentication, pools.getPool);
app.post('/login', noCache, security.login);
app.post('/logout', noCache, security.logout);

debug = config.debug || false;

app.locals.scriptPath = function(path) {
  if (!debug) {
    return path.replace(/.js$/, '.min.js');
  }
  return path;
};

app.get('/', function(req, res) {
  return res.render("index");
});

db.initialize(function() {
  var e, options, port, server, sslServer;
  poolStats.initialize();
  deviceStats.initialize();
  dbCleanup.initialize();
  port = app.get("port");
  server = http.createServer(app);
  io.http = require('socket.io').listen(server);
  io.http.set('log level', 1);
  io.http.set('authorization', security.socketAuthentication);
  server.listen(port, function(err) {
    if (err) {
      throw err;
    }
    return console.log("Express server listening on port " + port);
  });
  try {
    options = {
      ca: fs.readFileSync('./ssl-ca.crt'),
      cert: fs.readFileSync('./ssl-cert.crt'),
      key: fs.readFileSync('./ssl-key.pem')
    };
    sslServer = https.createServer(options, app);
    io.https = require('socket.io').listen(sslServer);
    io.https.set('log level', 1);
    io.https.set('authorization', security.socketAuthentication);
    return sslServer.listen(port + 1, function(err) {
      if (err) {
        throw err;
      }
      return console.log("Express server listening with SSL on port " + (port + 1));
    });
  } catch (_error) {
    e = _error;
  }
});
