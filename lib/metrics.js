var Metrics = require('metrics');
var report = new Metrics.Report();

var CATEGORIES = {
  all: 'global.all',
  static: 'global.static', // i.e. "/favicon.ico"
  status: 'status', // i.e. "status_200"
  method: 'method'
};

function getMetricName(route, methodName) {
  var routeName = CATEGORIES.static;

  if (route && route.path) {
    routeName = route.path;

    if (Object.prototype.toString.call(routeName) === '[object RegExp]') {
      routeName = routeName.source;
    }

    routeName = routeName + '.' + methodName.toLowerCase();
  }

  return routeName;
}

function updateMetric(name, time) {
  if (!report.getMetric(name)) {
    report.addMetric(name, new Metrics.Timer());
  }

  report.getMetric(name).update(time);
}

var metrics = {

  update: function (req, responseStatus, responseTime) {
    var metricName = getMetricName(req.route, req.method);

    updateMetric(CATEGORIES.all, responseTime);
    updateMetric(CATEGORIES.status + '.' + responseStatus, responseTime);
    updateMetric(CATEGORIES.method + '.' + req.method.toLowerCase(), responseTime);
    updateMetric(metricName, responseTime);
  },

  summary: function () {
    return report.summary();
  }
};

module.exports = metrics;