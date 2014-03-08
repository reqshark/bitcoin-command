var getFieldValidationExpression;

getFieldValidationExpression = function(formName, fieldName, attrs) {
  var dirtyExpression, fieldExpression, invalidExpression, key, watchExpression;
  if (attrs == null) {
    attrs = null;
  }
  fieldExpression = formName + "." + fieldName;
  invalidExpression = "" + fieldExpression + ".$invalid";
  dirtyExpression = "" + fieldExpression + ".$dirty";
  watchExpression = "[" + invalidExpression + "," + dirtyExpression;
  if (attrs != null) {
    for (key in attrs) {
      if (attrs.hasOwnProperty(key) && key !== 'for' && key !== 'class' && key.substr(0, 1) !== '$') {
        watchExpression += "," + fieldExpression + ".$error." + key;
      }
    }
  }
  watchExpression += "]";
  return watchExpression;
};

bitcoinApp.filter('validationFieldFlattener', function() {
  return function(field) {
    return JSON.stringify([field.$invalid, field.$dirty, field.$error]);
  };
});

bitcoinApp.directive("controlGroup", function() {
  return {
    restrict: "E",
    require: "^form",
    replace: true,
    transclude: true,
    template: "<div class=\"control-group\" ng-transclude></div>",
    link: function($scope, el, attrs, ctrl) {
      var fieldName, formName, watchExpression;
      formName = ctrl.$name;
      fieldName = attrs["for"];
      watchExpression = getFieldValidationExpression(formName, fieldName);
      return $scope.$watchCollection(watchExpression, function() {
        var error, errors, field, hasError;
        field = $scope[formName][fieldName];
        if (field.$pristine) {
          return;
        }
        hasError = false;
        errors = field.$error;
        for (error in errors) {
          if (errors.hasOwnProperty(error)) {
            if (errors[error]) {
              hasError = true;
              break;
            }
          }
        }
        if (hasError) {
          return el.addClass("error");
        } else {
          return el.removeClass("error");
        }
      });
    }
  };
});

bitcoinApp.directive("validationMessage", function() {
  return {
    restrict: "E",
    require: "^form",
    replace: true,
    template: "<div class=\"help-block\"></div>",
    link: function($scope, el, attrs, ctrl) {
      var fieldName, formName, watchExpression;
      formName = ctrl.$name;
      fieldName = attrs["for"];
      watchExpression = getFieldValidationExpression(formName, fieldName, attrs);
      return $scope.$watchCollection(watchExpression, function() {
        var error, errors, field, html, show;
        field = $scope[formName][fieldName];
        show = field.$invalid && field.$dirty;
        el.css("display", (show ? "" : "none"));
        html = "";
        if (show) {
          errors = field.$error;
          for (error in errors) {
            if (errors.hasOwnProperty(error)) {
              if (errors[error] && attrs[error]) {
                html += "<span>" + attrs[error] + " </span>";
              }
            }
          }
        }
        return el.html(html);
      });
    }
  };
});

bitcoinApp.directive("submitButton", function() {
  return {
    restrict: "E",
    require: "^form",
    transclude: true,
    replace: true,
    template: "<button " + "type=\"submit\" " + "class=\"btn btn-success\" " + "ng-transclude>" + "</button>",
    link: function($scope, el, attrs, ctrl) {
      var watchExpression;
      watchExpression = ctrl.$name + ".$invalid";
      return $scope.$watch(watchExpression, function(value) {
        return attrs.$set("disabled", !!value);
      });
    }
  };
});

bitcoinApp.directive("validSubmit", function() {
  return {
    restrict: "A",
    require: 'form',
    link: function($scope, el, attrs, ctrl) {
      var $element;
      $element = angular.element(el);
      attrs.$set("novalidate", "novalidate");
      return $element.bind("submit", function(e) {
        var form;
        e.preventDefault();
        $element.find(".ng-pristine").removeClass("ng-pristine");
        form = $scope[ctrl.$name];
        angular.forEach(form, function(formElement, fieldName) {
          if (fieldName[0] === "$") {
            return;
          }
          formElement.$pristine = false;
          formElement.$dirty = true;
        });
        if (form.$invalid) {
          $element.find(".ng-invalid").first().focus();
          $scope.$apply();
          return false;
        }
        $scope.$eval(attrs.validSubmit);
        return $scope.$apply();
      });
    }
  };
});
