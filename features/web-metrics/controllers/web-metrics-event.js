'use strict';

module.exports = [{
  event: 'update(web/route)',
  controller: function($socket, UserModel, $message) {
    if (!this.validMessage($message, {
      path: ['string', 'filled']
    })) {
      return;
    }

    if (!$socket.user || !$socket.user.id || !$message.path.match(/^\/metrics\/?$/)) {
      return;
    }

    UserModel.addHomeTile({
      date: new Date(),
      url: '/metrics',
      cover: '/public/web-metrics/web-metrics-home.jpg',
      large: true,
      centered: {
        title: 'METRICS'
      }
    }, $socket.user.id);
  }
}, {
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
