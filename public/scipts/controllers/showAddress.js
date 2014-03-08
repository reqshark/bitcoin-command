/*
  QR Code Controller
 */
bitcoinApp.controller('ShowAddressCtrl', function($scope, dialog, model) {
  $scope.title = "Bitcoin Address";
  $scope.state = 'created';
  $scope.address = model.address;
  $scope.label = model.label;
  return $scope.close = function() {
    return dialog.close();
  };
});
