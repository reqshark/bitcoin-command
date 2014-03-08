/*
  Login Controller
 */
bitcoinApp.controller('LoginCtrl', function($scope, $location, authentication) {
  return $scope.login = function() {
    return authentication.login($scope.username, $scope.password, $scope.rememberMe, function() {
      return $location.path('/');
    }, function(error) {
      console.log(error);
      return $scope.error = error || 'Unknown error.  Try again later.';
    });
  };
});
