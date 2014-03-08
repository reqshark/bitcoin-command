/*
    NavBar Controller
 */
bitcoinApp.controller('NavbarCtrl', function($scope, $route, $location, $rootScope, authentication) {
  $scope.navCollapsed = true;
  $scope.authenticated = authentication.isAuthenticated();
  $scope.$on('authenticationChanged', function() {
    return $scope.authenticated = authentication.isAuthenticated();
  });
  $scope.logout = function() {
    authentication.logout(function() {
      return $location.path('/');
    });
  };
  return $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
    $scope.navCollapsed = true;
  });
});
