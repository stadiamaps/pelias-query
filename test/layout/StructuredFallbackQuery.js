var StructuredFallbackQuery = require('../../layout/StructuredFallbackQuery');
var VariableStore = require('../../lib/VariableStore');
var diff = require('deep-diff').diff;

module.exports.tests = {};

module.exports.tests.base_render = function(test, common) {
  test('instance with nothing set should render to base request', function(t) {
    var query = new StructuredFallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');

    var actual = JSON.parse(JSON.stringify(query.render(vs)));
    var expected = require('../fixtures/fallbackQuery_nothing_set.json');

    t.deepEquals(actual, expected);
    t.end();

  });

  test('VariableStore with neighbourhood-only should only include neighbourhood parts and no fallbacks', function(t) {
    var query = new StructuredFallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');
    vs.var('input:neighbourhood', 'neighbourhood value');

    var actual = JSON.parse(JSON.stringify(query.render(vs)));
    var expected = require('../fixtures/fallbackQuery_neighbourhood_only.json');

    t.deepEquals(actual, expected);
    t.end();

  });

  test('VariableStore with postcode only', function(t) {
    var query = new StructuredFallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');
    vs.var('input:postcode', 'postcode value');

    var actual = JSON.parse(JSON.stringify(query.render(vs)));
    var expected = require('../fixtures/structuredFallbackQuery/postcode.json');

    t.deepEquals(actual, expected);
    t.end();

  });

  test('VariableStore with address and less granular fields should include all others', function(t) {
    var query = new StructuredFallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');
    vs.var('input:unit', 'unit value');
    vs.var('input:housenumber', 'house number value');
    vs.var('input:street', 'street value');
    vs.var('input:neighbourhood', 'neighbourhood value');
    vs.var('input:borough', 'borough value');
    vs.var('input:locality', 'locality value');
    vs.var('input:county', 'county value');
    vs.var('input:region', 'region value');
    vs.var('input:country', 'country value');
    vs.var('boost:address', 19);
    vs.var('boost:street', 17);

    var actual = JSON.parse(JSON.stringify(query.render(vs)));
    var expected = require('../fixtures/structuredFallbackQuery/address.json');

    t.deepEquals(actual, expected);
    t.end();

  });

  test('VariableStore with query and address fields should add query w/o address first', function(t) {
    var query = new StructuredFallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');
    vs.var('input:query', 'query value');
    vs.var('input:housenumber', 'house number value');
    vs.var('input:street', 'street value');
    vs.var('input:neighbourhood', 'neighbourhood value');
    vs.var('input:borough', 'borough value');
    vs.var('input:locality', 'locality value');
    vs.var('input:county', 'county value');
    vs.var('input:region', 'region value');
    vs.var('input:country', 'country value');
    vs.var('boost:address', 19);
    vs.var('boost:street', 17);

    var actual = JSON.parse(JSON.stringify(query.render(vs)));
    var expected = require('../fixtures/structuredFallbackQuery/query.json');

    t.deepEquals(actual, expected);
    t.end();

  });

  test('VariableStore with only housenumber should create housenumber only query', function(t) {
    var query = new StructuredFallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('input:housenumber', 'house number value');
    vs.var('track_scores', 'track_scores value');
    vs.var('boost:address', 19);

    var actual = JSON.parse(JSON.stringify(query.render(vs)));
    var expected = require('../fixtures/structuredFallbackQuery/housenumber.json');

    t.deepEquals(actual, expected);
    t.end();
  });

  test('input:postcode set should include it at the address layer query', function(t) {
    var query = new StructuredFallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');
    vs.var('input:housenumber', 'house number value');
    vs.var('input:street', 'street value');
    vs.var('input:postcode', 'postcode value');
    vs.var('boost:address', 19);
    vs.var('boost:street', 17);

    var actual = JSON.parse(JSON.stringify(query.render(vs)));
    var expected = require('../fixtures/structuredFallbackQuery/address_with_postcode.json');

    t.deepEquals(actual, expected);
    t.end();

  });

  test('vs with locality but not borough should add borough check', function(t) {
    var query = new StructuredFallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');
    vs.var('input:locality', 'locality value');
    vs.var('input:region', 'region value');

    var actual = JSON.parse(JSON.stringify(query.render(vs)));
    var expected = require('../fixtures/structuredFallbackQuery/locality_as_borough.json');

    t.deepEquals(actual, expected);
    t.end();

  });

};

module.exports.tests.boosts = function(test, common) {
  test('boost:street and boost:address missing from vs should not be include empty string', function(t) {
    var query = new StructuredFallbackQuery();

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');
    vs.var('input:housenumber', 'house number value');
    vs.var('input:street', 'street value');

    var actual = JSON.parse(JSON.stringify(query.render(vs)));

    t.false(actual.query.function_score.query.bool.should[0].bool.hasOwnProperty('boost'));
    t.false(actual.query.function_score.query.bool.should[1].bool.hasOwnProperty('boost'));
    t.end();

  });

};

module.exports.tests.scores = function(test, common) {
  test('scores rendering to falsy values should not be added', function(t) {
    var score_views_called = 0;

    var query = new StructuredFallbackQuery();

    [
      { 'score field 1': 'score value 1' },
      false,
      '',
      0,
      null,
      undefined,
      NaN,
      { 'score field 2': 'score value 2' },
    ].forEach(function(value) {
      query.score(function(vs) {
        // assert that `vs` was actually passed
        console.assert(vs !== null);
        // make a note that the view was actually called
        score_views_called++;
        return value;
      });
    });

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');

    var actual = JSON.parse(JSON.stringify(query.render(vs)));
    var actual_scoring_functions = actual.query.function_score.functions;

    var expected_scoring_functions = [
      { 'score field 1': 'score value 1'},
      { 'score field 2': 'score value 2'}
    ];

    t.deepEquals(actual_scoring_functions, expected_scoring_functions);
    t.equals(score_views_called, 8);
    t.end();

  });

};

module.exports.tests.filter = function(test, common) {
  test('all filter views returning truthy values should be added in order to sort', function(t) {
    // the views assert that the VariableStore was passed, otherwise there's no
    // guarantee that it was actually passed
    var filter_views_called = 0;

    var query = new StructuredFallbackQuery();

    [
      { 'filter field 1': 'filter value 1' },
      false, '', 0, null, undefined, NaN,
      { 'filter field 2': 'filter value 2' },
    ].forEach(function(value) {
      query.filter(function(vs) {
        // assert that `vs` was actually passed
        console.assert(vs !== null);
        // make a note that the view was actually called
        filter_views_called++;
        return value;
      });
    });

    var vs = new VariableStore();
    vs.var('size', 'size value');
    vs.var('track_scores', 'track_scores value');

    var actual = JSON.parse(JSON.stringify(query.render(vs)));

    var expected_filter = [
      { 'filter field 1': 'filter value 1'},
      { 'filter field 2': 'filter value 2'}
    ];

    t.equals(filter_views_called, 8);
    t.deepEquals(actual.query.function_score.query.bool.filter.bool.must, expected_filter);
    t.end();

  });
};

module.exports.all = function (tape, common) {
  function test(name, testFunction) {
    return tape('StructuredFallbackQuery ' + name, testFunction);
  }
  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};
