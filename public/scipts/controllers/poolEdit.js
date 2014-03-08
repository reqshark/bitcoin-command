/*
  Pool Edit Controller
 */
bitcoinApp.controller('PoolEditCtrl', function($scope, $location, $routeParams, pools) {
  $scope.pool = pools.get($routeParams.poolId);
  $scope.save = function(pool) {
    return pool.$save().then(function() {
      return $location.path('/pools');
    });
  };
});
