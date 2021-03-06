var Metrics = require('metrics');
var InfluxReporter = require('metrics-influxdb');
var os = require('os');
var logger = require('./logger');

var CATEGORIES = {
  all: 'global.all',
  static: 'global.static', // i.e. '/favicon.ico'
  status: 'status',
  method: 'method'
};

function Server(port, statsd, statsdRoutes, influxOptions) {
  this.metrics = new Metrics.Server(port);
  this.statsd = statsd;
  this.statsdRoutes = statsdRoutes;

  if(influxOptions){
      this.influxdbPrefix = influxOptions.influxdbPrefix || "express.";
      this.influxReporter = new InfluxReporter({ protocol: influxOptions.portocol || 'http',
          host:  influxOptions.host,
          database: influxOptions.database,
          consistency: influxOptions.consistency || 'any',
          tags: influxOptions.tags || {'host': os.hostname()},
          precision: influxOptions.precision || 'ms'
      });

      that = this;
      this.influxReporterInterval = setInterval(function () {
          that.influxReporter.report();
      }, 60000);
  }
}

Server.prototype.getMetricName = function getMetricName(route, methodName) {
  var routeName = CATEGORIES.static;

  if (route && route.path) {
    routeName = route.path;

    if (Object.prototype.toString.call(routeName) === '[object RegExp]') {
      routeName = routeName.source;
    }

    routeName = routeName + '.' + methodName.toLowerCase();
  }

  return routeName;
};

Server.prototype.update = function update(message) {
  var metricName = this.getMetricName(message.route, message.method);
  var path = message.route ? message.route.path : undefined;

  this.updateMetric(CATEGORIES.all, message.time);
  this.updateMetric(CATEGORIES.status + '.' + message.status, message.time);
  this.updateMetric(CATEGORIES.method + '.' + message.method, message.time);
  this.updateMetric(metricName, message.time);

  if (this.statsd && this.statsdRoutes[path]) {
    var route = this.statsdRoutes[path];
    if (route.methods.indexOf(message.method) !== -1) {
      this.sendToStatsD(route.name, message.time);
    }
  }
};

Server.prototype.updateMetric = function updateMetric(name, time) {
  if (!this.metrics.report.getMetric(name)) {
    this.metrics.addMetric(name, new Metrics.Timer());
    
    if(this.influxReporter){
      this.influxReporter.addMetric(this.influxdbPrefix + name, this.metrics.report.getMetric(name));
    }
  }

  this.metrics.report.getMetric(name).update(time);
};


Server.prototype.sendToStatsD = function sendToStatsD(name, time) {
  this.statsd.timing('.' + name, time, null, function (error) {
    if (error) {
      logger.error('Error sending response time to StatsD: ', error);
    }
  });
};


Server.prototype.stop = function stop(callback) {
  this.metrics.server.close(callback);
};

module.exports = Server;


module.exports = Server;
