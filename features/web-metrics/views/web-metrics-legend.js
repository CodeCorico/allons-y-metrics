(function() {
  'use strict';

  window.Ractive.controllerInjection('web-metrics-legend', [
    '$WebMetricsService', '$component', '$data', '$done',
  function webMetricsLegendController(
    $WebMetricsService, $component, $data, $done
  ) {

    var WebMetricsLegend = $component({
          data: $.extend(true, {
            showInfo: false,
            totals: {}
          }, $data)
        });

    function _readChart(args) {
      if (args.error || !args.chart || !args.chart.length) {
        return;
      }

      var lastNamespace = null;

      WebMetricsLegend.set('chart', args.chart
        .map(function(serie) {
          serie = $.extend(true, {}, serie || null);

          serie.namespaceTitle = serie.namespace == lastNamespace ? null : serie.namespace;
          lastNamespace = serie.namespace;

          return serie;
        }));
    }

    $WebMetricsService.onSafe('webMetricsLegendController.readChart', _readChart);

    function _totals(args) {
      WebMetricsLegend.set('totals', $.extend(true, {}, args.totals));
    }

    $WebMetricsService.onSafe('webMetricsLegendController.totals', _totals);

    WebMetricsLegend.on('toggleSerie', function(event) {
      event.context.activated = !event.context.activated;

      WebMetricsLegend.update(event.keypath);

      if (!event.context.activated) {
        $WebMetricsService.fire('leaveSerie', {
          index: event.keypath.split('.')[1]
        });
      }

      $WebMetricsService.activeSerie({
        index: event.keypath.split('.')[1],
        activated: event.context.activated
      });
    });

    WebMetricsLegend.on('serieMouseenter', function(event) {
      if (!event.context.activated) {
        return;
      }

      $WebMetricsService.fire('hoverSerie', {
        index: event.keypath.split('.')[1]
      });
    });

    WebMetricsLegend.on('serieMouseleave', function(event) {
      if (!event.context.activated) {
        return;
      }

      $WebMetricsService.fire('leaveSerie', {
        index: event.keypath.split('.')[1]
      });
    });

    WebMetricsLegend.on('selectAll', function() {
      WebMetricsLegend.get('chart').forEach(function(value) {
        value.activated = true;
      });

      WebMetricsLegend.update('chart');

      $WebMetricsService.activeAllSeries();
    });

    WebMetricsLegend.on('unselectAll', function() {
      WebMetricsLegend.get('chart').forEach(function(value) {
        value.activated = false;
      });

      WebMetricsLegend.update('chart');

      $WebMetricsService.deactiveAllSeries();
    });

    WebMetricsLegend.on('toggleInfo', function() {
      WebMetricsLegend.set('showInfo', !WebMetricsLegend.get('showInfo'));
    });

    WebMetricsLegend.require().then(function() {
      if ($WebMetricsService.lastChart()) {
        _readChart({
          chart: $WebMetricsService.lastChart()
        });
      }

      if ($WebMetricsService.totals()) {
        _totals({
          totals: $WebMetricsService.totals()
        });
      }

      $done();
    });
  }]);

})();
