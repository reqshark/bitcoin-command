/*
    Reload Link Directive
 */
bitcoinApp.directive('reload', function($route, $location, $rootScope) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs, controller) {
      element.on('click', function() {
        if ('#' + $location.path() === attrs.href) {
          $route.reload();
          if (!$rootScope.$$phase) {
            $rootScope.$apply();
          }
        }
      });
    }
  };
});
