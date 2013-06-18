var { Geocode } = require('geocode');
var { Geolocation } = require('geolocation');

exports["test 0001 empty geocode results"] = function(assert) {
	assert.equal(Geocode.getAddressesByType('postal_code').length, 0, "no results yet");
	assert.equal(Geocode.getAddressByType('postal_code'), null, "no results yet");
};

exports["test 001 manual lookup failed promise"] = function(assert, done) {
	Geocode.once('error', assert.pass);
	Geocode.lookup(Geolocation.coords).then(function success(results) {
		assert.fail('cannot get a lookup of empty coords');
		done();
	}, function fail(error) {
		assert.pass('this should fail when we there is no geolocation available');
		done();
	});
};

exports["test 01 get geocode results"] = function(assert, done) {
	Geocode.on('geocode', function(results) {
		assert.pass("got geocoded event");
		done();
	});
	assert.equal(Geocode.sensor, false, 'sensor defaults to false');
	Geocode.sensor = true;
	assert.equal(Geocode.sensor, true, 'set sensor to true and it stuck');
  Geolocation.allowed = true;
  Geolocation.getCurrentPosition();
};

exports["test get geocode results"] = function(assert) {
	var postal_code = Geocode.getAddressByType('postal_code');
	assert.ok(postal_code, 'got an address ' + postal_code.formatted_address);
};

exports["test get multiple geocode results"] = function(assert) {
	var political = Geocode.getAddressesByType('political');
	assert.ok(Array.isArray(political), 'got multiple');
	assert.ok(political.length > 0, 'got an address ' + political[0].formatted_address);
};

exports["test manual lookup promise"] = function(assert, done) {
	Geocode.lookup(Geolocation.coords).then(function success(results) {
		assert.pass('got some results');
		done();
	}, assert.fail);
};

require("sdk/test").run(exports);
