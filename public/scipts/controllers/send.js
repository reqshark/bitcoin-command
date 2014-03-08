/*
  Send / Sell Controller
 */
bitcoinApp.controller('SendCtrl', function($scope, popups, $location, $timeout, walletInfo) {
  $scope.tx = {};
  $scope.status = {};
  $scope.wallet = walletInfo.getSummary(1);
  $scope.recentRecipients = walletInfo.getRecentRecipients();
  $scope.sending = false;
  $scope.formatAddress = function(item) {
    return item != null ? item.address : void 0;
  };
  $scope.selectedAddress = function(item) {
    $scope.tx.name = item.name;
    return $timeout(function() {
      return $('input[name=amount]').focus();
    });
  };
  $scope.positive = function(amount) {
    return $.trim(amount) === '' || amount >= 0.00000001;
  };
  $scope.underBalance = function(amount) {
    if (($scope.wallet.balance != null) && amount >= 0.00000001) {
      return amount <= $scope.wallet.balance;
    } else {
      return true;
    }
  };
  return $scope.send = function(tx) {
    var message, recipient;
    recipient = tx.name != null ? "<b>" + tx.name + "</b> (" + tx.address + ")" : "<b>" + tx.address + "</b>";
    message = "Send <b>" + tx.amount + "</b> BTC to " + recipient + "?";
    return popups.messageBox("Please confirm", message, [
      {
        result: true,
        label: 'Yes, Send It',
        cssClass: 'btn-success btn-small'
      }, {
        result: false,
        label: 'No, I Changed My Mind',
        cssClass: 'btn-danger btn-small'
      }
    ]).open().then(function(result) {
      if (result) {
        $scope.sending = true;
        $scope.error = '';
        return walletInfo.sendTx(tx).then(function() {
          return $location.path('/wallet');
        }, function(error) {
          $scope.sending = false;
          return $scope.error = error;
        });
      }
    });
  };
});


/*
    $scope.recentRecipients = {
        name: 'recentRecipients'
        prefetch: {
            url: '/wallet/recentRecipients'
            filter: (response) ->
                _.map response, (item) ->
                    {
                        value: item.address
                        name: item.name
                        address: item.address
                        shortAddress: item.address.substr(0, 10) + '...'
                        tokens: _.union(item.name.split(' '))
                    }
            ttl: 0
        }
        header: '<h3>Recent Recipients</h3>'
        template: [
            '<span>'
            '<span class="address-name">[[name]]</span>'
            ' - '
            '<span class="address-value visible-desktop">[[address]]</span>'
            '<span class="address-value hidden-desktop">[[shortAddress]]</span>'
            '</span>'
        ].join('')
        engine: HoganWrapper
    }
 */
