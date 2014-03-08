/*
    Authentication Service
 */
bitcoinApp.factory('authentication', function($http, $rootScope, $cookieStore) {
  var authenticated, changeAuthenticated;
  authenticated = $cookieStore.get('authenticated') || false;
  changeAuthenticated = function(newValue) {
    if (authenticated === !newValue) {
      authenticated = newValue;
      return $rootScope.$broadcast('authenticationChanged');
    }
  };
  return {
    isAuthenticated: function() {
      return authenticated;
    },
    login: function(username, password, rememberMe, success, error) {
      return $http.post('/login', {
        username: username,
        password: password,
        rememberMe: rememberMe
      }).success(function(response) {
        if (response.success) {
          changeAuthenticated(true);
          if (typeof success === "function") {
            success();
          }
        } else {
          error(response.error);
        }
      }).error(function() {
        if (typeof error === "function") {
          error();
        }
      });
    },
    logout: function(success, error) {
      return $http.post('/logout').success(function() {
        changeAuthenticated(false);
        return typeof success === "function" ? success() : void 0;
      }).error(error);
    }
  };
});
