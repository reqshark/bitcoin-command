/*
  Wallet Controller
 */
bitcoinApp.controller('WalletCtrl', function($scope, walletInfo, popups) {
  $scope.count = 50;
  $scope.wallet = walletInfo.getSummary($scope.count);
  $scope.filterTerm = '';
  $scope.newAddress = function() {
    return popups.newAddress().open();
  };
  $scope.show = function(count) {
    $(document.body).addClass('wait');
    return $scope.wallet.$get({
      show: count
    }).then(function() {
      $scope.count = count;
      return $(document.body).removeClass('wait');
    });
  };
  $scope.clearFilterTerm = function() {
    return $scope.filterTerm = '';
  };
  return $scope.filterTermKeyDown = function(event) {
    if (event.keyCode === 27) {
      return $scope.clearFilterTerm();
    }
  };
});
