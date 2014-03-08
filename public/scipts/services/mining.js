/*
    Mining Data Service
 */
bitcoinApp.factory('miningStats', function($http, $q, $resource) {
  var chart, summary;
  summary = $resource('/mining/summary');
  chart = $resource('/mining/chart');
  return {
    getSummary: function() {
      return summary.get();
    },
    getChart: function() {
      return chart.get();
    }
  };
});
