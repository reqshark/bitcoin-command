/*
	Main Module
 */
var bitcoinApp;

bitcoinApp = angular.module('bitcoinApp', ['ngRoute', 'ngCookies', 'ngResource', 'ngSanitize', 'ui.validate', 'ui.bootstrap', 'interval']).config(function($routeProvider, $httpProvider) {
  var anonymous, interceptor, requireAuthentication;
  requireAuthentication = function(original) {
    var resolver;
    if (original == null) {
      original = {};
    }
    resolver = {};
    _.extend(resolver, original, {
      __authentication: function($q, authentication) {
        var deferred;
        if (authentication.isAuthenticated()) {
          deferred = $q.defer();
          deferred.resolve();
          return deferred.promise;
        } else {
          return $q.reject('/login');
        }
      }
    });
    return resolver;
  };
  anonymous = function(original) {
    if (original == null) {
      original = {};
    }
    return original;
  };
  interceptor = function($location, $q) {
    var error, success;
    success = function(response) {
      return response;
    };
    error = function(response) {
      if (response.status === 401) {
        console.log('oops, session appears to be expired');
        $location.path('/login');
        return $q.reject(response);
      } else {
        return $q.reject(response);
      }
    };
    return function(promise) {
      return promise.then(success, error);
    };
  };
  $httpProvider.responseInterceptors.push(interceptor);
  $routeProvider.when('/dashboard', {
    templateUrl: '/templates/dashboard.html',
    controller: 'DashboardCtrl',
    title: 'Dashboard',
    resolve: requireAuthentication()
  });
  $routeProvider.when('/pools', {
    templateUrl: '/templates/pools.html',
    controller: 'PoolsCtrl',
    title: 'Pools',
    resolve: requireAuthentication()
  });
  $routeProvider.when('/pools/:poolId', {
    templateUrl: '/templates/poolEdit.html',
    controller: 'PoolEditCtrl',
    title: 'Edit Pool',
    resolve: requireAuthentication()
  });
  $routeProvider.when('/wallet', {
    templateUrl: '/templates/wallet.html',
    controller: 'WalletCtrl',
    title: 'Wallet',
    resolve: requireAuthentication()
  });
  $routeProvider.when('/wallet/send', {
    templateUrl: '/templates/send.html',
    controller: 'SendCtrl',
    title: 'Send Bitcoins',
    resolve: requireAuthentication()
  });
  $routeProvider.when('/wallet/sign', {
    templateUrl: '/templates/sign.html',
    controller: 'SignCtrl',
    title: 'Sign Message',
    resolve: requireAuthentication()
  });
  $routeProvider.when('/wallet/addresses', {
    templateUrl: '/templates/addressList.html',
    controller: 'AddressListCtrl',
    title: 'Addresses',
    resolve: requireAuthentication()
  });
  $routeProvider.when('/login', {
    templateUrl: '/templates/login.html',
    controller: 'LoginCtrl',
    title: 'Login',
    resolve: anonymous()
  });
  return $routeProvider.otherwise({
    redirectTo: '/dashboard'
  });
}).run(function($rootScope, $location) {
  $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
    if (rejection === '/login') {
      $location.path('/login');
    }
  });
  $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
    var _ref;
    $rootScope.pageTitle = current != null ? (_ref = current.$$route) != null ? _ref.title : void 0 : void 0;
  });
});
