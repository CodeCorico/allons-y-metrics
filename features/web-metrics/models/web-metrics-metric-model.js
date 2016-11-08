module.exports = function() {
  'use strict';

  DependencyInjection.model('WebMetricModel', function($allonsy, $AbstractModel) {

    var URL_PATTERN = /^\/metrics/,
        PERMISSIONS = {
          'web-metrics-access': {
            title: 'Access to the Metrics app',
            description: 'Access to the Metrics app.',
            isPublic: true
          }
        },
        METRICS_HOME_TILE = {
          url: '/metrics',
          cover: '/public/web-metrics/web-metrics-home.png',
          large: true,
          centered: {
            title: 'METRICS'
          }
        },

        extend = require('extend'),
        $WebMetricsService = DependencyInjection.injector.model.get('$WebMetricsService'),
        _transactions = [];

    return $AbstractModel('WebMetricModel', function() {

      return {
        identity: 'webmetrics',
        connection: 'WebMetrics',
        migrate: 'safe',
        autoCreatedAt: false,
        autoUpdatedAt: false,
        attributes: {
          key: {
            type: 'string',
            index: true
          }
        },

        init: function() {
          var GroupModel = DependencyInjection.injector.model.get('GroupModel'),
              UserModel = DependencyInjection.injector.model.get('UserModel');

          GroupModel.registerPermissions(PERMISSIONS);

          $WebMetricsService.model(this);

          UserModel.homeDefaultTile(extend(true, {
            date: new Date()
          }, METRICS_HOME_TILE), ['web-metrics-access']);
        },

        addLog: function(log) {
          if (!log || typeof log != 'object' || !log.args || (!log.args.metric && !log.args.metrics)) {
            return;
          }

          var _this = this;

          if (log.args.metrics) {
            log.args.metrics.forEach(function(metric) {
              _this.addLog({
                namespace: log.namespace,
                args: {
                  metric: metric
                }
              });
            });

            return;
          }

          _transactions.push({
            namespace: log.namespace,
            metric: log.args.metric
          });

          if (_transactions.length > 1) {
            return;
          }

          this.transaction();
        },

        dayDate: function(date) {
          date = date || new Date();

          return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        },

        lastTwoMonthsDates: function() {
          var dayDate = this.dayDate().getTime();

          return Array.apply(null, {
            length: 60
          }).map(function(value, i) {
            return dayDate - (1000 * 3600 * 24 * i);
          });
        },

        transaction: function() {
          var _this = this;

          if (!_transactions.length) {
            return;
          }

          var log = _transactions[0],
              $SocketsService = DependencyInjection.injector.model.get('$SocketsService'),
              activeDate = _this.dayDate().getTime();

          this
            .findOrCreate({
              key: log.metric.key
            })
            .exec(function(err, metric) {
              if (err) {
                $allonsy.logWarning('allons-y-web-metrics', 'metrics:metric-add:error', {
                  error: err
                });

                if (_transactions.length) {
                  _transactions.shift();
                }

                _this.transaction();

                return;
              }

              metric.key = metric.key || log.metric.key;
              metric.namespace = metric.namespace || log.namespace;
              metric.name = metric.name || log.metric.name;
              metric.description = metric.description || log.metric.description;
              metric.dates = metric.dates || {};

              metric.dates[activeDate] = metric.dates[activeDate] || 0;
              metric.dates[activeDate] += log.metric.value || 1;

              _this
                .update({
                  key: metric.key
                }, metric)
                .exec(function(err) {
                  if (_transactions.length) {
                    _transactions.shift();
                  }

                  if (err) {
                    $allonsy.logWarning('allons-y-web-metrics', 'metrics:metric-save:error', {
                      error: err
                    });

                    _this.transaction();

                    return;
                  }

                  var result = {
                    chart: [{
                      date: activeDate
                    }]
                  };

                  result.chart[0][metric.key] = {
                    value: metric.dates[activeDate]
                  };

                  $SocketsService.emit(null, {
                    'user.permissions': 'web-metrics-access',
                    'route.url': URL_PATTERN
                  }, null, 'read(web-metrics/chart)', result);

                  _this.transaction();
                });
            });
        },

        chartData: function(callback) {
          var _this = this,
              datesList = _this.lastTwoMonthsDates();

          _this
            .find()
            .exec(function(err, metrics) {
              if (err) {
                return callback(err);
              }

              for (var i = 0; i < metrics.length; i++) {
                metrics[i] = metrics[i].toJSON();
                metrics[i].data = [];

                for (var j = 0; j < datesList.length; j++) {
                  metrics[i].data.push([datesList[j], metrics[i].dates[datesList[j]] || 0]);
                }

                metrics[i].data.sort(function(a, b) {
                  return a[0] > b[0] ? 1 : (a[0] < b[0] ? -1 : 0);
                });

                delete metrics[i].dates;
              }

              callback(null, metrics);
            });
        }
      };

    });

  });

  return 'WebMetricModel';
};
