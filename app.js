
let citiesData = {};

fetch("cities.json")
  .then(res => res.json())
  .then(data => {
    citiesData = data;
    const countrySelect = document.getElementById("countrySelector");
    for (const country in data) {
      const opt = document.createElement("option");
      opt.value = country;
      opt.textContent = country;
      countrySelect.appendChild(opt);
    }
  });

document.getElementById("countrySelector").addEventListener("change", function () {
  const country = this.value;
  populateCities(country);
});

function populateCities(country) {
  const citySelect = document.getElementById("citySelector");
  citySelect.innerHTML = '<option value="">-- Choisir une ville --</option>';
  if (citiesData[country]) {
    const sortedCities = Object.keys(citiesData[country]).sort();
    for (const city of sortedCities) {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    }
  }
}

document.getElementById("citySelector").addEventListener("change", function () {
  const city = this.value;
  const country = document.getElementById("countrySelector").value;
  if (citiesData[country] && citiesData[country][city]) {
    const [lat, lon] = citiesData[country][city];
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lon;
    calculateTimes({ latitude: lat, longitude: lon });
  }
});

document.getElementById("gpsBtn").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        document.getElementById("latitude").value = latitude.toFixed(4);
        document.getElementById("longitude").value = longitude.toFixed(4);

        let closestCity = null;
        let closestCountry = null;
        let minDist = Infinity;

        for (const country in citiesData) {
          for (const city in citiesData[country]) {
            const [clat, clon] = citiesData[country][city];
            const dist = distance(latitude, longitude, clat, clon);
            if (dist < minDist) {
              minDist = dist;
              closestCity = city;
              closestCountry = country;
            }
          }
        }

        if (closestCity && closestCountry) {
          document.getElementById("countrySelector").value = closestCountry;
          populateCities(closestCountry);

          setTimeout(() => {
            document.getElementById("citySelector").value = closestCity;
            document.getElementById("citySelector").dispatchEvent(new Event("change"));
          }, 100);
        }

        calculateTimes({ latitude, longitude });
      },
      err => {
        showError("Erreur GPS : " + err.message);
        calculateTimesManual();
      }
    );
  } else {
    showError("Géolocalisation non supportée");
    calculateTimesManual();
  }
});

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function calculateTimes(coords) {
  try {
    const params = adhan.CalculationMethod.Other();
    params.fajrAngle = parseFloat(document.getElementById('angleFajr').value);
    const ishaInterval = parseInt(document.getElementById("maghribToIsha").value);
    const ishaAngle = parseFloat(document.getElementById('angleIsha').value);

    if (ishaInterval > 0) {
      params.ishaInterval = ishaInterval;
      params.ishaAngle = 0;
    } else {
      params.ishaAngle = ishaAngle;
    }

    const date = new Date();
    const location = new adhan.Coordinates(coords.latitude, coords.longitude);
    const prayerTimes = new adhan.PrayerTimes(location, date, params);

    const maghribTime = prayerTimes.maghrib;
    const customIsha = ishaInterval > 0
      ? new Date(maghribTime.getTime() + ishaInterval * 60000)
      : prayerTimes.isha;

    const formatTime = time => time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

    document.getElementById("times").innerHTML = `
      <div class="prayer-time"><strong>🕋 Fajr</strong><span>${formatTime(prayerTimes.fajr)}</span></div>
      <div class="prayer-time"><strong>🕛 Dhuhr</strong><span>${formatTime(prayerTimes.dhuhr)}</span></div>
      <div class="prayer-time"><strong>🕒 Asr</strong><span>${formatTime(prayerTimes.asr)}</span></div>
      <div class="prayer-time"><strong>🌇 Maghrib</strong><span>${formatTime(prayerTimes.maghrib)}</span></div>
      <div class="prayer-time"><strong>🌙 Isha</strong><span>${formatTime(customIsha)}</span></div>
    `;

    const city = document.getElementById("citySelector").value;
    const country = document.getElementById("countrySelector").value;
    document.getElementById("cityDisplay").textContent = city && country ? `${city}, ${country}` : "";
  } catch (err) {
    showError("Erreur lors du calcul des horaires.");
  }
}

function calculateTimesManual() {
  const lat = parseFloat(document.getElementById("latitude").value);
  const lon = parseFloat(document.getElementById("longitude").value);
  calculateTimes({ latitude: lat, longitude: lon });
}

function showError(msg) {
  document.getElementById("error").textContent = msg;
}
