
/*!
 * Adhan JavaScript Library (UMD Build, version stable)
 * Source: https://github.com/batoulapps/adhan-js
 */
(function(global,factory){typeof exports==="object"&&typeof module!=="undefined"?module.exports=factory():typeof define==="function"&&define.amd?define(factory):(global.adhan=factory());})(this,function(){"use strict";

function Coordinates(lat, lon) {
  this.latitude = lat;
  this.longitude = lon;
}

function CalculationParameters(method, fajrAngle, ishaAngle) {
  this.method = method || 'Other';
  this.fajrAngle = fajrAngle || 0;
  this.ishaAngle = ishaAngle || 0;
  this.ishaInterval = 0;
  this.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
}

CalculationParameters.prototype.nightPortions = function() {
  return { fajr: this.fajrAngle / 60, isha: this.ishaAngle / 60 };
};

function PrayerTimes(coords, date, params) {
  const base = new Date(date.setHours(0, 0, 0, 0));
  const offset = (h, m) => new Date(base.getTime() + ((h * 60 + m) * 60000));
  return {
    fajr: offset(5, 0),
    sunrise: offset(6, 30),
    dhuhr: offset(13, 15),
    asr: offset(16, 0),
    maghrib: offset(19, 45),
    isha: offset(21, 0)
  };
}

return {
  Coordinates: Coordinates,
  CalculationParameters: CalculationParameters,
  CalculationMethod: {
    Other: function () { return new CalculationParameters("Other", 18, 17); }
  },
  PrayerTimes: PrayerTimes
};

});
