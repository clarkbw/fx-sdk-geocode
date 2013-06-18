/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
  strict:true, undef:true, curly:true, browser:true, esnext:true,
  indent:2, maxerr:50, devel:true, node:true, boss:true, white:true,
  globalstrict:true, nomen:false, newcap:false*/

"use strict";

if (!require('sdk/system/xul-app').is('Firefox')) {
  throw new Error("The geocode module is only tested in Firefox.");
}

const { Class } = require('sdk/core/heritage'),
      { XMLHttpRequest } = require('sdk/net/xhr'),
      { EventTarget } = require('sdk/event/target'),
      { emit } = require('sdk/event/core'),
      { merge } = require('sdk/util/object'),
      { stringify } = require('sdk/querystring'),
      { URL } = require('sdk/url'),
      { defer } = require('sdk/core/promise'),
      { ns } = require('sdk/core/namespace');

const { Geolocation } = require('geolocation');

var namespace = ns();

/**
 * This object is for geocoding locations or getting human readable addresses
 * from a latitude and longitude.
 *
 * This module requires the `fx-sdk-geolocation` module to work.
 * 
 * It will emit a single event, `geocode` when it has geocoded a set of addresses from
 * the coordinates given to the `lookup()` function. 
 *
 * By default including this module will watch for geolocation coordinates and geocode them.
 *
 * Here's how you could easily use this Geocoding module:
 *
 * Register for the "geocode" event:
 *
 * @example
 *  Geocode.once("geocode", function(results) {
 *    console.log("got results!", JSON.stringify(results, null, " "));
 *    // or
 *    console.log("got a postal code type address", Geocode.getAddressByType('postal_code').formatted_address);
 *  });
 *  // we need a 'coords' event in order to later get a `geocode` event
 *  Geolocation.getCurrentPosition();
 *
 * Manually you could use the promise style return passing in your own coords object
 *
 * @example
 *  Geocode.lookup({latitude : 37.7891094, longitude : -122.3892471 }).then(function (results) {
 *    // same as the event above
 *  });
 */
var GeocodeClass = Class({

  GOOGLE_GEOCODING_API : "https://maps.googleapis.com/maps/api/geocode/json",

  'extends' : EventTarget,

  initialize: function initialize(options) {
    EventTarget.prototype.initialize.call(this, options);
    var privateAPI = namespace(this);

    privateAPI.options = merge({
      sensor    : false,
      language  : null
    }, options);


    Geolocation.on('coords', this.lookup.bind(this));
  },

  /**
   * Getter/Setter for the sensor option (defaults to false)
   * The sensor value is required by the API if you are using a sensor to detect location
   * @type Boolean
   */
  get sensor() { return namespace(this).options.sensor; },
  set sensor(sensor) {
    namespace(this).options.sensor = sensor;
  },

  /**
   * Getter/Setter for the language option (defaults to null)
   * To retrieve the geocoded information in an alternate language
   * XXX Currently this doesn't get passed in so don't bother
   * @type String
   * @see https://developers.google.com/maps/faq#languagesupport
   */
  get language() { return namespace(this).options.language; },
  set language(language) {
    namespace(this).options.language = language;
  },

  /**
   * Returns multiple matching address blocks from the results
   * Requires that geocoding has been perfomed at least once before using
   * @returns {Array} of objects
   */
  getAddressesByType : function getAddressesByType(type) {
    if (namespace(this).results) {
      return namespace(this).results.filter(function (addr) {
        return (addr.types && Array.isArray(addr.types) && addr.types.indexOf(type) >= 0);
      });
    }
    return [];
  },

  /**
   * Returns the first single matching address block from the results
   * Requires that geocoding has been perfomed at least once before using
   * @returns {Object} address block object
   */
  getAddressByType : function getAddressByType(type) {
    var result = null;
    if (namespace(this).results) {
      namespace(this).results.some(function (addr) {
        if (addr.types && Array.isArray(addr.types) && addr.types.indexOf(type) >= 0) {
          result = addr;
          return true;
        }
        return false;
      });
    }
    return result;
  },

  /**
   * Returns a promise which will resolve with the full set of results of geocoding
   * @param {Object} coords with required latitude and longitude property
   * @returns {Array} of address block results
   */
  lookup : function lookup(coords) {
    var url = null,
        privateAPI = namespace(this),
        self = this,
        deferred = defer(),
        req = new XMLHttpRequest();
    try {
      url = new URL(this.GOOGLE_GEOCODING_API + "?" + 
                    stringify({ latlng: coords.latitude + "," + coords.longitude, 
                                sensor: this.sensor }));

      req.open("GET", url.toString());
      req.onreadystatechange = function () {
        var response = null;
        if (this.readyState === 4 && this.status === 200) {
          try {
            response = JSON.parse(this.responseText);
            if (response.status && response.status === "OK") {
              privateAPI.results = response.results;
              deferred.resolve(response.results);
              emit(self, "geocode", response.results);
            }
          } catch (exception) {
            deferred.reject(exception);
          }
        } else if (this.readyState === 4 && this.status !== 200) {
          deferred.reject(this.status);
        }
      };
      req.send(null);
    } catch (e) {
      deferred.reject(e);
      emit(self, "error", e);
    }
    return deferred.promise;
  }
});

exports.Geocode = new GeocodeClass();
