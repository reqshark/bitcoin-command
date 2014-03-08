/*
  Dashboard Controller
 */
bitcoinApp.controller('DashboardCtrl', function($scope, $timeout, miningStats, walletInfo, authentication, socket, safeIdFilter) {
  var chartConfig, miningTimeout, oncePerMinute, oncePerTenSeconds, sixtySeconds, tenSeconds, updateChart, updateMiningSummary, updatePrice, updateWallet, walletTimeout;
  $scope.authenticated = authentication.isAuthenticated();
  $scope.mining = miningStats.getSummary();
  $scope.wallet = walletInfo.getSummary(5);
  $scope.price = walletInfo.getPrice();
  updateMiningSummary = function() {
    return $scope.mining.$get();
  };
  updatePrice = function() {
    return $scope.price.$get();
  };
  updateWallet = function() {
    return $scope.wallet.$get({
      show: 5
    });
  };
  Highcharts.setOptions({
    global: {
      useUTC: false
    }
  });
  chartConfig = {
    chart: {
      backgroundColor: '#f6f6f6',
      type: 'area',
      animation: true
    },
    credits: {
      enabled: false
    },
    colors: ['#4572a7', '#aa4643', '#80699b', '#3d96ae', '#db843d'],
    plotOptions: {
      area: {
        fillOpacity: 0.5,
        lineWidth: 1
      },
      series: {
        animation: false,
        marker: {
          enabled: false
        },
        stacking: 'normal'
      }
    },
    xAxis: {
      type: 'datetime',
      tickInterval: 24 * 3600 * 1000,
      gridLineWidth: 1,
      endOnTick: false
    },
    yAxis: {
      min: 0,
      showFirstLabel: false,
      endOnTick: false,
      title: {
        text: null
      },
      labels: {
        formatter: function() {
          return hashrateFilter(this.value);
        }
      }
    },
    loading: true,
    title: {
      text: 'Hash Rate, Past 3 Days'
    }
  };
  updateChart = function() {
    return miningStats.getChart().$promise.then(function(chartData) {
      var _ref;
      chartConfig.plotOptions.series.pointInterval = chartData.pointInterval;
      chartConfig.plotOptions.series.pointStart = chartData.pointStart;
      chartConfig.series = chartData.series;
      chartConfig.loading = false;
      if ((_ref = $('#chart').highcharts()) != null) {
        _ref.destroy();
      }
      $('#chart').highcharts(chartConfig);
    });
  };
  updateChart();
  socket.on('share', function(data) {
    var device, deviceId, id, pool, poolId, _i, _len, _ref;
    if ($scope.mining.devices != null) {
      poolId = "#pool-" + (safeIdFilter(data.pool));
      deviceId = "#device-" + (safeIdFilter(data.hostname + ':' + data.device));
      _ref = [poolId, deviceId];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        $(id).stop().clearQueue().fadeTo(0, 1).fadeTo(700, 0);
      }
      device = _.find($scope.mining.devices[data.hostname], function(d) {
        return d.device === data.device;
      });
      pool = _.find($scope.mining.pools, function(p) {
        return p.name === data.pool;
      });
      if ((device != null) && (pool != null)) {
        device.lastPool = data.pool;
        device.lastShare = moment().unix();
        return pool.lastShare = moment().unix();
      } else {
        console.log('Detected new device/pool');
        updateMiningSummary();
        return updateChart();
      }
    }
  });
  sixtySeconds = 60000;
  oncePerMinute = $timeout(miningTimeout = function() {
    updateMiningSummary();
    updateChart();
    updatePrice();
    oncePerMinute = $timeout(miningTimeout, sixtySeconds);
  }, sixtySeconds);
  tenSeconds = 10000;
  oncePerTenSeconds = $timeout(walletTimeout = function() {
    updateWallet();
    oncePerTenSeconds = $timeout(walletTimeout, tenSeconds);
  }, tenSeconds);
  return $scope.$on('$destroy', function() {
    socket.removeAllListeners();
    if (oncePerTenSeconds) {
      $timeout.cancel(oncePerTenSeconds);
    }
    if (oncePerMinute) {
      return $timeout.cancel(oncePerMinute);
    }
  });
});
