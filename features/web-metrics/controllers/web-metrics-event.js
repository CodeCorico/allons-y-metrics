'use strict';

module.exports = [{
  event: 'call(web-metrics/chart)',
  permissions: ['web-metrics-access'],
  controller: function($SocketsService, $socket, WebMetricModel) {
    if (!WebMetricModel) {
      return;
    }

    WebMetricModel.chartData(function(err, data) {
      if (err || !data) {
        return $SocketsService.error($socket, null, 'read(web-metrics/chart)', err);
      }

      $socket.emit('read(web-metrics/chart)', {
        chart: data
      });
    });
  }
}];
