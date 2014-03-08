/*
  Prompt Controller
 */
bitcoinApp.controller('NewAddressCtrl', function($scope, $timeout, dialog, walletInfo) {
  $scope.title = "New Address";
  $scope.state = 'prompt';
  $scope.create = function() {
    $scope.state = 'creating';
    return walletInfo.newAddress($scope.label).then(function(address) {
      $scope.address = address.address;
      return $scope.state = 'created';
    }, function() {
      return $scope.state = 'error';
    });
  };
  return $scope.close = function() {
    return dialog.close();
  };
});
