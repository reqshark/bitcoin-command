/*
  Sign Controller
 */
bitcoinApp.controller('SignCtrl', function($scope, popups, $location, $timeout, walletInfo) {
  $scope.msg = {};
  $scope.status = {};
  $scope.addresses = walletInfo.getAddresses();
  $scope.signing = false;
  $scope.signed = false;
  $scope.selectedAddress = function(item) {
    return $timeout(function() {
      return $('textarea[name=message]').focus();
    });
  };
  $scope.$watchCollection('[msg.address, msg.message, msg.passphrase]', function() {
    return $scope.signed = false;
  });
  return $scope.sign = function(msg) {
    $scope.signed = false;
    $scope.signing = true;
    $scope.error = '';
    return walletInfo.signMsg(msg).then(function(signature) {
      $scope.signature = signature;
      $scope.signed = true;
      return $scope.signing = false;
    }, function(error) {
      $scope.signing = false;
      return $scope.error = error;
    });
  };
});
