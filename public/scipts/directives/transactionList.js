/*
    Transaction List Directive
 */
bitcoinApp.directive('transactionList', function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/templates/directives/transactionList.html',
    scope: {
      transactions: '=',
      filter: '='
    }
  };
});
