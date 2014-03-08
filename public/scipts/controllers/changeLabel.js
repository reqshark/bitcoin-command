/*
  Prompt Controller
 */
bitcoinApp.controller('ChangeLabelCtrl', function($scope, dialog, model) {
  $scope.title = model.title;
  $scope.address = model.address;
  $scope.initial = model.label;
  $scope.buttons = model.buttons;
  $scope.cancel = function() {
    return dialog.close({
      result: false
    });
  };
  return $scope.save = function() {
    return dialog.close({
      result: true,
      label: $scope.label
    });
  };
});
