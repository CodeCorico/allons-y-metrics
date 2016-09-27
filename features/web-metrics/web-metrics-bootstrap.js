'use strict';

module.exports = function($allonsy, $options, $done) {
  if ($options.owner != 'fork' || $options.processName != 'Allons-y Express') {
    return $done();
  }

  var path = require('path');

  require(path.resolve(__dirname, 'models/web-metrics-service-back.js'))();

  if (!process.env.WEB_METRICS || process.env.WEB_METRICS != 'true') {
    return $done();
  }

  var $WebMetricsService = DependencyInjection.injector.controller.get('$WebMetricsService');

  $allonsy.on('log', function(log) {
    $WebMetricsService.log(log);
  });

  $done();
};
