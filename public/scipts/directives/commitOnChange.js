bitcoinApp.directive('commitOnChange', function($timeout) {
  return {
    require: "ngModel",
    link: function($scope, $element, $attrs, modelCtrl) {
      var $setViewValue, bufferViewValue, bufferedValue, flushViewValue, onChange;
      bufferedValue = void 0;
      onChange = function(e) {
        return $timeout(flushViewValue);
      };
      bufferViewValue = function(value) {
        return bufferedValue = value;
      };
      flushViewValue = function() {
        return $setViewValue.call(modelCtrl, bufferedValue);
      };
      $setViewValue = modelCtrl.$setViewValue;
      modelCtrl.$setViewValue = bufferViewValue;
      return $element.bind("change", onChange);
    }
  };
});
