var optionsChecker = require('../../lib/options.checker');

describe('Influxdb Integration', function () {

  describe('Options Management', function () {
    it('Default instantiation when no creational options are passed', function () {
      (function () {
        optionsChecker.check({
          port: 1234,
          influxdb: {
            tags: {},
            influxdbPrefix: 'foo'
          }
        });
      }).should.throw();
    });


    it('Internal instantiation', function () {
      (function (){
        optionsChecker.check({
          port: 1234,
          statsd: {
            host: 'localhost',
            database: 'foo'
          }
        });
      }).should.not.throw();
    });

    it('No database provided', function () {
      (function (){
        optionsChecker.check({
          port: 1234,
          statsd: {
            host: 'localhost',
          }
        });
      }).should.throw();
    });


    it('No host provided', function () {
      (function (){
        optionsChecker.check({
          port: 1234,
          statsd: {
            database: 'foo',
          }
        });
      }).should.throw();
    });
  });
});