/*
  Address List Controller
 */
bitcoinApp.controller('AddressListCtrl', function($scope, walletInfo, popups) {
  $scope.loading = true;
  $scope.addresses = walletInfo.getAddresses();
  $scope.addresses.$promise.then(function() {
    return $scope.loading = false;
  });
  $scope.showArchived = false;
  $scope.toggleArchived = function(item) {
    item.archived = !item.archived;
    item.$save();
  };
  $scope.rename = function(item) {
    popups.changeLabel(item.address, item.label).open().then(function(result) {
      if (result != null ? result.result : void 0) {
        item.label = result.label;
        item.$save();
      }
    });
  };
  $scope.qr = function(item) {
    popups.showAddress(item.address, item.label).open();
  };
});
