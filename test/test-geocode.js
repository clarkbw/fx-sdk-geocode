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
	Geocode.once('geocode', function(results) {
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
	// test caching
	var cache = Geocode.getAddressByType('postal_code');
	assert.ok(cache, 'got an address from the cache ' + cache.formatted_address);
	assert.equal(postal_code, cache, 'cache is the same as the original');
};

exports["test get multiple geocode results"] = function(assert) {
	var political = Geocode.getAddressesByType('political');
	assert.ok(Array.isArray(political), 'got multiple');
	assert.ok(political.length > 0, 'got an address ' + political[0].formatted_address);
	// check that the cached delivers the same results
	var cache = Geocode.getAddressesByType('political');
	assert.ok(Array.isArray(cache), 'got multiple');
	assert.ok(cache.length > 0, 'got an address from the cache ' + cache[0].formatted_address);
	assert.equal(political, cache, 'cache is the same as the original');
};

exports["test manual lookup promise"] = function(assert, done) {
	Geocode.lookup(Geolocation.coords).then(function success(results) {
		assert.pass('got some results');
		done();
	}, assert.fail);
};

// we want this one to run last since it blows away the local coords cache
exports["test zzzz cache removal"] = function(assert, done) {
	// lookup Vancouver
	Geocode.lookup({latitude : '49.25', longitude : '-123.1'}).then(function success(results1) {
		assert.pass('got some results');
		var postal_code = Geocode.getAddressByType('postal_code');
		// lookup Boston
		Geocode.lookup({latitude : '42.358056', longitude : '-71.063611'}).then(function success(results2) {
			assert.notEqual(postal_code, Geocode.getAddressByType('postal_code'));
			done();
		}, assert.fail);
	}, assert.fail);
};

require("sdk/test").run(exports);
