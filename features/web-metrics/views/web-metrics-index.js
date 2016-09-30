(function() {
  'use strict';

  window.bootstrap([
    '$Page', '$BodyDataService', '$i18nService', '$done',
  function($Page, $BodyDataService, $i18nService, $done) {

    var _user = $BodyDataService.data('user') || null;

    if (_user && _user.permissionsPublic && _user.permissionsPublic.indexOf('web-metrics-access') > -1) {
      $Page.remember(/^\/metrics\/?$/);

      $Page.push('apps', {
        name: $i18nService._('Metrics'),
        select: function() {
          window.page('/metrics');
        }
      });
    }

    $done();
  }]);

})();
