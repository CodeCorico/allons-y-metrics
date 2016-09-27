(function() {
  'use strict';

  window.Ractive.controllerInjection('web-metrics-layout', [
    '$Page', '$Layout', '$i18nService', '$WebMetricsService',
    '$component', '$data', '$done',
  function webMetricsLayoutController(
    $Page, $Layout, $i18nService, $WebMetricsService,
    $component, $data, $done
  ) {

    var WebMeticsLayout = $component({
          data: $data
        }),
        _chart = null;

    function _resize() {
      setTimeout(function() {
        if (_chart) {
          _chart.reflow();
        }
      }, 1000);
    }

    function _leftContextOpened() {
      _resize();
    }

    function _rightContextOpened() {
      _resize();
    }

    function _drawChart(data) {
      _chart = new window.Highcharts.Chart({
        chart: {
          type: 'line',
          zoomType: 'x',
          renderTo: $('.web-metrics-container')[0]
        },
        credits: {
          enabled: false
        },
        title: {
          text: null
        },
        subtitle: {
          text: null
        },
        tooltip: {
          formatter: function() {
            return [
              window.Highcharts.dateFormat('%d/%m', new Date(this.x)),
              ' - ',
              this.series.name, ': ',
              '<strong>', this.y, '</strong>'
            ].join('');
          }
        },
        xAxis: {
          startOnTick: true,
          tickInterval: 24 * 3600 * 1000 * 2,
          type: 'datetime',
          labels: {
            rotation: -45,
            align: 'right'
          },
          dateTimeLabelFormats: {
            month: '%e. %b'
          },
          events: {
            setExtremes: function(event) {
              $WebMetricsService.setExtremes(event.min, event.max);
            }
          }
        },
        yAxis: {
          title: {
            text: null
          },
          allowDecimals: false
        },
        plotOptions: {
          line: {
            animation: false,
            showInLegend: false
          }
        },
        exporting: {
          buttons: {
            contextButton: {
              enabled: false
            }
          }
        },
        series: data
      });
    }

    $WebMetricsService.onSafe('webMetricsLayoutController.readChartSerie', function(args) {
      if (args.error || !args.serie) {
        return;
      }

      var updatedSerie = $.extend(true, [], args.serie),
          serie = _chart.series[updatedSerie.index];

      serie.data[updatedSerie.dateIndex].update(updatedSerie.updatedData[1]);
    });

    $WebMetricsService.onSafe('webMetricsLayoutController.readChart', function(args) {
      if (args.error || !args.chart || !args.chart.length) {
        return;
      }

      var data = $.extend(true, [], args.chart);

      _drawChart(data);
    });

    $WebMetricsService.on('webMetricsLayoutController.activeSerie', function(args) {
      _chart.series[args.index].setVisible(args.activated);
    });

    $WebMetricsService.on('webMetricsLayoutController.activeAllSeries', function() {
      _chart.series.forEach(function(serie) {
        serie.setVisible(true, false);
      });
    });

    $WebMetricsService.on('webMetricsLayoutController.deactiveAllSeries', function() {
      _chart.series.forEach(function(serie) {
        serie.setVisible(false, false);
      });
    });

    $WebMetricsService.on('webMetricsLayoutController.hoverSerie', function(args) {
      if (!_chart.series[args.index] || !_chart.series[args.index].data) {
        return;
      }

      _chart.series[args.index].data.forEach(function(point) {
        point.setState('hover');
      });
    });

    $WebMetricsService.on('webMetricsLayoutController.leaveSerie', function(args) {
      if (!_chart.series[args.index] || !_chart.series[args.index].data) {
        return;
      }

      _chart.series[args.index].data.forEach(function(point) {
        point.setState('');
      });
    });

    $WebMetricsService.onSafe('webMetricsLayoutController.teardown', function() {
      WebMeticsLayout.teardown();
      WebMeticsLayout = null;
      $Layout.off('leftContextOpened', _leftContextOpened);
      $Layout.off('rightContextOpened', _rightContextOpened);

      setTimeout(function() {
        $WebMetricsService.offNamespace('webMetricsLayoutController');
      });
    });

    $Layout.on('leftContextOpened', _leftContextOpened);
    $Layout.on('rightContextOpened', _rightContextOpened);

    $done();
  }]);

})();
