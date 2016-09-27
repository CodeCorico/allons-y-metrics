module.exports = function() {
  'use strict';

  DependencyInjection.service('$WebMetricsService', function() {

    return new (function $WebMetricsService() {

      var WebMetricModel = false,
          _waitingLogs = [];

      this.model = function(model) {
        WebMetricModel = model;

        _waitingLogs.forEach(function(log) {
          WebMetricModel.addLog(log);
        });

        _waitingLogs = [];
      };

      this.log = function(log) {
        if (WebMetricModel) {
          WebMetricModel.addLog(log);
        }
        else {
          _waitingLogs.push(log);
        }
      };

    })();

  });

};
