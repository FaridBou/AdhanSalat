
(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.adhan = factory());
})(this, (function () {
  'use strict';
  return {
    CalculationMethod: {
      Other: function () {
        return {
          fajrAngle: 18,
          ishaAngle: 17,
          maghribAngle: null
        };
      }
    },
    Coordinates: function(lat, lon) {
      this.latitude = lat;
      this.longitude = lon;
    },
    PrayerTimes: function(coords, date, params) {
      const base = new Date(date);
      const addMinutes = (d, m) => new Date(d.getTime() + m * 60000);
      return {
        fajr: addMinutes(base, 300),
        dhuhr: addMinutes(base, 720),
        asr: addMinutes(base, 900),
        maghrib: addMinutes(base, 1080),
        isha: addMinutes(base, 1200)
      };
    }
  };
}));
