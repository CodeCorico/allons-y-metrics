module.exports = function() {
  'use strict';

  DependencyInjection.service('$WebMetricsService', [
    '$AbstractService', '$socket',
  function($AbstractService, $socket) {

    return new (function $WebMetricsService() {

      $AbstractService.call(this);

      // http://tools.medialab.sciences-po.fr/iwanthue/
      var LEGEND_COLORS = [
            '#7970E7', '#D56421', '#5EA1E0', '#A6CA65', '#D87951', '#58D86A', '#A7782E', '#818355', '#BE60E5',
            '#798475', '#AEC589', '#70C3E7', '#DA4975', '#65CFD8', '#DE94E0', '#986AAA', '#508D8A', '#A9C1C4',
            '#A398E1', '#8D778F', '#E99E33', '#D653B5', '#E7C53B', '#558AA4', '#65D392', '#E58288', '#6AE037',
            '#AC6476', '#4BCFB8', '#DFA6C1', '#E040D6', '#DA4A57', '#B7765B', '#E64431', '#E1398F', '#CD68A0',
            '#4A935E', '#828735', '#BAB7DC', '#DBB96E', '#62AE2C', '#AC8777', '#607AAF', '#508E2F', '#91C6A8',
            '#B7D238', '#5B7EDA', '#ACA22A', '#A564C5', '#D7BBA6'
          ],

          _this = this,
          _lastChart = null,
          _extremes = {
            min: null,
            max: null
          },
          _totals = null;

      $socket.on('read(web-metrics/chart)', function(args) {
        if (!args || !args.chart || !args.chart.length) {
          return;
        }

        if (args.chart.length === 1 && !args.chart[0].hasOwnProperty('name')) {
          if (!_lastChart) {
            return;
          }

          var updatedSerieData = args.chart[0],
              updatedDate = new Date(updatedSerieData.date).getTime();

          for (var updatedDataKey in updatedSerieData) {
            if (['date', 'activated', 'color'].indexOf(updatedDataKey) === -1) {
              for (var serieIndex = 0; serieIndex < _lastChart.length; serieIndex++) {
                if (_lastChart[serieIndex].key === updatedDataKey) {
                  var serieData = _lastChart[serieIndex].data;

                  for (var dateIndex = 0; dateIndex < serieData.length; dateIndex++) {
                    if (serieData[dateIndex][0] == updatedDate) {
                      serieData[dateIndex][1] = updatedSerieData[updatedDataKey].value;

                      _this.fire('readChartSerie', {
                        serie: {
                          index: serieIndex,
                          dateIndex: dateIndex,
                          updatedData: serieData[dateIndex]
                        }
                      });

                      break;
                    }
                  }
                }
              }
            }
          }
        }
        else {
          args.chart.sort(function(a, b) {
            if (a.namespace < b.namespace) {
              return -1;
            }
            if (a.namespace > b.namespace) {
              return 1;
            }
            if (a.name < b.name) {
              return -1;
            }
            if (a.name > b.name) {
              return 1;
            }

            return 0;
          });

          args.chart.forEach(function(serie, i) {
            serie.color = LEGEND_COLORS[i % LEGEND_COLORS.length];
            serie.activated = _lastChart && _lastChart[i] && !_lastChart[i].activated ? false : true;
          });

          _lastChart = args.chart;

          _this.fire('readChart', {
            chart: _lastChart
          });
        }

        _this.updateTotals();
      });

      this.lastChart = function() {
        return _lastChart;
      };

      this.callChart = function() {
        $socket.emit('call(web-metrics/chart)');
      };

      this.openChart = function() {
        _this.callChart();
      };

      this.printChart = function() {
        _this.fire('printChart');
      };

      this.activeAllSeries = function() {
        _this.fire('activeAllSeries');
      };

      this.deactiveAllSeries = function() {
        _this.fire('deactiveAllSeries');
      };

      this.activeSerie = function(args) {
        if (!args) {
          return;
        }

        _this.fire('activeSerie', {
          index: args.index,
          activated: args.activated
        });
      };

      this.setExtremes = function(min, max) {
        _extremes.min = min;
        _extremes.max = max;

        _this.updateTotals();
      };

      this.updateTotals = function() {
        var min = _extremes.min || 0,
            max = _extremes.max || 9999999999999;

        _totals = {};

        _lastChart.forEach(function(serie) {
          var total = 0;

          serie.data.forEach(function(line) {
            if (min <= line[0] && max >= line[0]) {
              total += line[1];
            }
          });

          _totals[serie.key] = total;
        });

        _this.fire('totals', {
          totals: _totals
        });
      };

      this.totals = function() {
        return _totals;
      };

      this.onSafe('$WebMetricsService.teardown', function() {
        _lastChart = null;
      });

      this.onSafe('init', function() {
        _lastChart = null;
        _this.callChart();
      });

    })();

  }]);

};
