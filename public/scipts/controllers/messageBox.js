/*
  MessageBox Controller
 */
bitcoinApp.controller('MessageBoxCtrl', function($scope, dialog, model) {
  $scope.title = model.title;
  $scope.message = model.message;
  $scope.buttons = model.buttons;
  return $scope.close = function(result) {
    return dialog.close(result);
  };
});
