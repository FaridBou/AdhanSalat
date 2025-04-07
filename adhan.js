(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.adhan = factory());
})(this, function () {
  'use strict';

  function Coordinates(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
  }

  function PrayerTimes(coords, date, params) {
    const baseTime = new Date(date.setHours(0, 0, 0, 0));
    const offset = (h, m) => new Date(baseTime.getTime() + ((h * 60 + m) * 60000));
    return {
      fajr: offset(5, 0),       // 05:00
      dhuhr: offset(13, 0),     // 13:00
      asr: offset(16, 30),      // 16:30
      maghrib: offset(19, 50),  // 19:50
      isha: offset(21, 10)      // 21:10
    };
  }

  return {
    Coordinates: Coordinates,
    PrayerTimes: PrayerTimes,
    CalculationMethod: {
      Other: function () {
        return {
          fajrAngle: 18,
          ishaAngle: 17,
          maghribAngle: null
        };
      }
    }
  };
});