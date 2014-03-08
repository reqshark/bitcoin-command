/*
    Popups Service
 */
bitcoinApp.factory('popups', function($dialog) {
  return {
    messageBox: function(title, message, buttons) {
      return $dialog.dialog({
        templateUrl: '/templates/messageBox.html',
        controller: 'MessageBoxCtrl',
        resolve: {
          model: function() {
            return {
              title: title,
              message: message,
              buttons: buttons
            };
          }
        }
      });
    },
    changeLabel: function(address, label) {
      return $dialog.dialog({
        templateUrl: '/templates/changeLabel.html',
        controller: 'ChangeLabelCtrl',
        resolve: {
          model: function() {
            return {
              address: address,
              label: label
            };
          }
        }
      });
    },
    newAddress: function() {
      return $dialog.dialog({
        templateUrl: '/templates/newAddress.html',
        controller: 'NewAddressCtrl'
      });
    },
    showAddress: function(address, label) {
      return $dialog.dialog({
        templateUrl: '/templates/newAddress.html',
        controller: 'ShowAddressCtrl',
        resolve: {
          model: function() {
            return {
              address: address,
              label: label
            };
          }
        }
      });
    }
  };
});
