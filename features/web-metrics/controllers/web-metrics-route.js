'use strict';

module.exports = {
  url: '/metrics',

  enter: [
    '$Page', '$FaviconService', '$BodyDataService', '$i18nService', '$Layout', '$next',
  function($Page, $FaviconService, $BodyDataService, $i18nService, $Layout, $next) {
    var user = $BodyDataService.data('user');

    if (user.permissionsPublic.indexOf('web-metrics-access') < 0) {
      return $next();
    }

    document.title = $i18nService._('Metrics') + ' - ' + $Page.get('web').brand;
    $FaviconService.update('/public/web-metrics/favicon.png');

    $Layout.selectApp('Metrics', false);

    setTimeout(function() {
      require('/public/web-metrics/web-metrics-service.js')
        .then(function() {
          return require('/public/vendor/highcharts/highcharts.js');
        })
        .then(function() {
          return $Layout.require('web-metrics-layout');
        })
        .then(function() {
          var $WebMetricsService = DependencyInjection.injector.view.get('$WebMetricsService');

          $Page.leftButtonAdd('web-metrics-legend', {
            icon: 'fa fa-list-ul',
            group: 'group-web-metrics-legend',
            ready: function(button) {
              if ($Layout.get('screen') == 'screen-desktop') {
                button.action(false);
              }
            },
            beforeGroup: function(context, $group, userBehavior, callback) {
              context.require('web-metrics-legend').then(callback);
            }
          });

          $WebMetricsService.init();
        });
    });
  }],

  exit: ['$Page', '$Layout', '$context', '$next', function($Page, $Layout, $context, $next) {
    require('/public/web-metrics/web-metrics-service.js').then(function() {
      var $WebMetricsService = DependencyInjection.injector.view.get('$WebMetricsService'),
          pathname = window.location.pathname,
          pathnameSplitted = pathname.split('/');

      if (!pathnameSplitted || pathnameSplitted.length < 2 || pathnameSplitted[1] != 'web-metrics') {
        $Layout.leftContext().closeIfGroupOpened('group-web-metrics-legend');
        $Page.leftButtonRemove('web-metrics-legend');

        return $WebMetricsService.teardown(null, $next);
      }
    });
  }]
};
