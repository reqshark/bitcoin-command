var hashrateFilter;

hashrateFilter = null;

bitcoinApp.filter('archived', function() {
  return function(array, archived) {
    if (archived == null) {
      archived = true;
    }
    return _.filter(array, function(item) {
      var _ref;
      return ((_ref = item.archived) != null ? _ref : false) === archived;
    });
  };
});

bitcoinApp.filter('safeId', function() {
  return function(input) {
    return CryptoJS.MD5(input).toString();
  };
});

bitcoinApp.filter('hashrate', function() {
  return hashrateFilter = function(input) {
    var hashrate, units;
    hashrate = Number(input);
    if (isNaN(hashrate) || hashrate <= 0) {
      return "-";
    }
    units = "MH";
    if (hashrate >= 1000) {
      hashrate /= 1000;
      units = "GH";
    }
    if (hashrate >= 1000) {
      hashrate /= 1000;
      units = "TH";
    }
    if (hashrate >= 1000) {
      hashrate /= 1000;
      units = "PH";
    }
    hashrate = hashrate.toPrecision(3);
    return "" + hashrate + " " + units + "/s";
  };
});

bitcoinApp.filter('confirmationCount', function(numberFilter) {
  return function(transaction) {
    if (transaction.confirmed) {
      return '✓';
    } else {
      return numberFilter(transaction.confirmations, '0');
    }
  };
});

bitcoinApp.filter('transactionDescription', function() {
  return function(tx) {
    var msg;
    msg = '';
    switch (tx.category) {
      case 'receive':
        msg = tx.account != null ? tx.account : tx.address;
        break;
      case 'send':
        msg = 'to: ';
        if (tx.to != null) {
          msg += tx.to;
        } else {
          msg += tx.address;
        }
        if (tx.comment != null) {
          msg += " (" + tx.comment + ")";
        }
        if (tx.fee < 0) {
          msg += ", fee: " + (tx.fee * -1);
        }
        break;
      case 'generate':
      case 'immature':
        if (tx.account != null) {
          msg += "" + tx.account + ", ";
        }
        msg += "generated";
        break;
      default:
        msg = 'unknown';
    }
    return msg;
  };
});

bitcoinApp.filter('bitcoin', function(numberFilter) {
  return function(amount) {
    var formatted, i, length;
    formatted = numberFilter(amount, 8);
    if (formatted !== '') {
      i = 0;
      length = formatted.length;
      while (i < 6) {
        if (formatted.substr(length - i - 1, 1) !== '0') {
          break;
        }
        i++;
      }
      formatted = formatted.substr(0, length - i);
    }
    return formatted;
  };
});

bitcoinApp.filter('timeSince', function() {
  return function(timestamp) {
    var now;
    now = moment.unix();
    if (timestamp > now) {
      return 'just now';
    }
    return moment.unix(timestamp).fromNow().replace('a few seconds ago', 'just now');
  };
});

bitcoinApp.filter('suffix', function() {
  return function(value, suffix, includeZero) {
    if (includeZero == null) {
      includeZero = true;
    }
    if ((value != null) && value !== '' && (value !== 0 || includeZero)) {
      return value + suffix;
    } else {
      return '';
    }
  };
});

bitcoinApp.filter('prefix', function() {
  return function(value, prefix, includeZero) {
    if (includeZero == null) {
      includeZero = true;
    }
    if ((value != null) && value !== '' && (value !== 0 || includeZero)) {
      return prefix + value;
    } else {
      return '';
    }
  };
});

bitcoinApp.filter('rejectPercent', function() {
  return function(counts) {
    var rejected;
    rejected = 0;
    if (counts.shares !== 0) {
      rejected = (100 * counts.rejected / counts.shares).toFixed(1);
    }
    return "" + rejected + "%";
  };
});

bitcoinApp.filter('prettyJson', function() {
  return function(obj) {
    return JSON.stringify(obj, null, 2);
  };
});
