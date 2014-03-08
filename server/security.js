var checkCookie, config, cookie, maxAge, opts, secureCookieName, statusCookieName, utils;

config = require('config');

cookie = require('cookie');

utils = require('client-sessions').util;

secureCookieName = 'authtoken';

statusCookieName = 'authenticated';

maxAge = 365 * 24 * 3600 * 1000;

opts = {
  cookieName: secureCookieName,
  secret: config.cookieSecretKey,
  duration: maxAge
};

checkCookie = function(cookies) {
  var authCookie, authenticated, data, _ref;
  authenticated = false;
  authCookie = cookies[secureCookieName];
  if (authCookie != null) {
    data = utils.decode(opts, authCookie);
    if (data != null ? (_ref = data.content) != null ? _ref.authenticated : void 0 : void 0) {
      authenticated = true;
    }
  }
  return authenticated;
};

exports.socketAuthentication = function(handshakeData, accept) {
  var cookies;
  cookies = cookie.parse(handshakeData.headers.cookie);
  if (checkCookie(cookies)) {
    return accept(null, true);
  } else {
    return accept('Unauthorized request. Please log in first.', false);
  }
};

exports.authParser = function() {
  return function(req, res, next) {
    req.authenticated = checkCookie(req.cookies);
    res.cookie(statusCookieName, JSON.stringify(req.authenticated), {
      path: '/'
    });
    next();
  };
};

exports.requireAuthentication = function(req, res, next) {
  if (req.authenticated) {
    next();
    return;
  }
  res.statusCode = 401;
  res.json({
    error: 'Unauthorized request. Please log in first.'
  });
  res.end();
};

exports.login = function(req, res) {
  if (req.body.username.toLowerCase() === config.authentication.username.toLowerCase() && req.body.password === config.authentication.password) {
    req.authenticated = true;
    res.cookie(statusCookieName, JSON.stringify(req.authenticated), {
      path: '/'
    });
    if (req.body.rememberMe) {
      res.cookie(secureCookieName, utils.encode(opts, {
        authenticated: true
      }), {
        path: '/',
        httpOnly: true,
        maxAge: maxAge
      });
    } else {
      res.cookie(secureCookieName, utils.encode(opts, {
        authenticated: true
      }), {
        path: '/',
        httpOnly: true
      });
    }
    return res.json({
      success: true
    });
  } else {
    return res.json({
      error: 'Invalid username/password'
    });
  }
};

exports.logout = function(req, res) {
  req.authenticated = false;
  res.cookie(statusCookieName, JSON.stringify(req.authenticated), {
    path: '/'
  });
  res.clearCookie(secureCookieName, {
    path: '/'
  });
  return res.send();
};
