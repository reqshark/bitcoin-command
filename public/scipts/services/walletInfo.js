/*
	Wallet Service
 */
bitcoinApp.factory('walletInfo', function($resource, $http, $q) {
  var addresses, price, recipients, summary;
  summary = $resource('/wallet/summary');
  price = $resource('/wallet/price');
  recipients = $resource('/wallet/recentRecipients', {}, {
    'get': {
      method: 'GET',
      isArray: true
    }
  });
  addresses = $resource('/wallet/addresses');
  return {
    getSummary: function(num) {
      return summary.get({
        show: num
      });
    },
    getPrice: function() {
      return price.get();
    },
    getRecentRecipients: function() {
      return recipients.get();
    },
    getAddresses: function() {
      return addresses.query();
    },
    newAddress: function(label) {
      var deferred;
      deferred = $q.defer();
      $http.post('/wallet/newaddress', {
        label: label
      }).success(function(address) {
        return deferred.resolve(address);
      }).error(function() {
        return deferred.reject();
      });
      return deferred.promise;
    },
    sendTx: function(tx) {
      var deferred;
      deferred = $q.defer();
      $http({
        method: 'POST',
        url: '/wallet/send',
        data: tx
      }).success(function() {
        return deferred.resolve();
      }).error(function(data, status) {
        return deferred.reject(data.error);
      });
      return deferred.promise;
    },
    signMsg: function(msg) {
      var deferred;
      deferred = $q.defer();
      $http({
        method: 'POST',
        url: '/wallet/sign',
        data: msg
      }).success(function(data) {
        return deferred.resolve(data.signature);
      }).error(function(data, status) {
        return deferred.reject(data.error);
      });
      return deferred.promise;
    }
  };
});
