/*
  Pools Controller
 */
bitcoinApp.controller('PoolsCtrl', function($scope, $location, pools) {
  $scope.pools = pools.getAll();
  $scope.toggleEnabled = function(pool) {
    pool.enabled = !pool.enabled;
    return pools.save(pool);
  };
  $scope.deletePool = function(pool) {
    var index;
    pools["delete"](pool.id);
    index = _.indexOf($scope.pools, pool);
    if (index >= 0) {
      return $scope.pools.splice(index, 1);
    }
  };
  $scope.editPool = function(pool) {
    return $location.path('/pools/' + pool.id);
  };
});
