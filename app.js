
let citiesData = {};
let currentCity = "";
let currentCountry = "";

async function loadCities() {
  const response = await fetch("cities.json");
  citiesData = await response.json();
  populateCountries();
}

function populateCountries() {
  const countrySelect = document.getElementById("countrySelector");
  Object.keys(citiesData).sort().forEach(country => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });
}

document.getElementById("countrySelector").addEventListener("change", () => {
  const country = document.getElementById("countrySelector").value;
  const citySelect = document.getElementById("citySelector");
  citySelect.innerHTML = "<option value=''>-- Choisir une ville --</option>";
  if (citiesData[country]) {
    Object.entries(citiesData[country])
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([city, [lat, lon]]) => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
  }
});

document.getElementById("citySelector").addEventListener("change", () => {
  const country = document.getElementById("countrySelector").value;
  const city = document.getElementById("citySelector").value;
  if (citiesData[country] && citiesData[country][city]) {
    const [lat, lon] = citiesData[country][city];
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lon;
    currentCity = city;
    currentCountry = country;
    calculateTimesManual();
  }
});

document.getElementById("gpsBtn").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      document.getElementById("latitude").value = latitude.toFixed(4);
      document.getElementById("longitude").value = longitude.toFixed(4);
      findClosestCity(latitude, longitude);
      calculateTimesManual();
    }, err => {
      alert("Erreur GPS : " + err.message);
    });
  } else {
    alert("Géolocalisation non supportée");
  }
});

function findClosestCity(lat, lon) {
  let closest = null;
  let minDist = Infinity;

  for (const [country, cities] of Object.entries(citiesData)) {
    for (const [city, [clat, clon]] of Object.entries(cities)) {
      const dist = distance(lat, lon, clat, clon);
      if (dist < minDist) {
        minDist = dist;
        closest = { city, country, lat: clat, lon: clon };
      }
    }
  }

  if (closest) {
    document.getElementById("countrySelector").value = closest.country;
    document.getElementById("countrySelector").dispatchEvent(new Event("change"));

    setTimeout(() => {
      document.getElementById("citySelector").value = closest.city;
    }, 100);

    currentCity = closest.city;
    currentCountry = closest.country;
  }
}

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function calculateTimesManual() {
  const lat = parseFloat(document.getElementById("latitude").value);
  const lon = parseFloat(document.getElementById("longitude").value);
  calculateTimes({ latitude: lat, longitude: lon });
}

function calculateTimes(coords) {
  const params = adhan.CalculationMethod.Other();
  const ishaInterval = parseInt(document.getElementById("maghribToIsha").value);
  const ishaAngle = parseFloat(document.getElementById("angleIsha").value);

  params.fajrAngle = parseFloat(document.getElementById("angleFajr").value);
  params.ishaAngle = ishaInterval > 0 ? 0 : ishaAngle;
  params.ishaInterval = ishaInterval > 0 ? ishaInterval : 0;

  const date = new Date();
  const location = new adhan.Coordinates(coords.latitude, coords.longitude);
  const prayerTimes = new adhan.PrayerTimes(location, date, params);

  const maghribTime = prayerTimes.maghrib;
  const customIsha = ishaInterval > 0 ? new Date(maghribTime.getTime() + ishaInterval * 60000) : prayerTimes.isha;

  const now = new Date();
  const prayers = {
    Fajr: prayerTimes.fajr,
    Dhuhr: prayerTimes.dhuhr,
    Asr: prayerTimes.asr,
    Maghrib: prayerTimes.maghrib,
    Isha: customIsha
  };

  let current = "Isha";
  for (const [name, time] of Object.entries(prayers)) {
    if (now < time) {
      current = name;
      break;
    }
  }

  const nextPrayerName = {
    Fajr: "🕋 Fajr",
    Dhuhr: "🕛 Dhuhr",
    Asr: "🕒 Asr",
    Maghrib: "🌇 Maghrib",
    Isha: "🌙 Isha"
  };

  const format = t => t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  document.getElementById("cityDisplay").textContent = `${currentCity || ""} ${currentCountry || ""}`.trim();
  document.getElementById("times").innerHTML = Object.entries(prayers).map(([name, time]) => `
    <div class="prayer-time ${current === name ? "current" : ""}">
      <strong>${nextPrayerName[name]}</strong><span>${format(time)}</span>
    </div>`).join("");

  updateCountdown(prayers, current);
}

function updateCountdown(prayers, currentPrayer) {
  const next = {
    Fajr: "Dhuhr",
    Dhuhr: "Asr",
    Asr: "Maghrib",
    Maghrib: "Isha",
    Isha: "Fajr"
  };

  let nextTime = prayers[next[currentPrayer]];
  if (currentPrayer === "Isha") {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const coords = {
      latitude: parseFloat(document.getElementById("latitude").value),
      longitude: parseFloat(document.getElementById("longitude").value)
    };
    const params = adhan.CalculationMethod.Other();
    params.fajrAngle = parseFloat(document.getElementById("angleFajr").value);
    params.ishaAngle = parseFloat(document.getElementById("angleIsha").value);
    params.ishaInterval = parseInt(document.getElementById("maghribToIsha").value);
    const tomorrowTimes = new adhan.PrayerTimes(new adhan.Coordinates(coords.latitude, coords.longitude), tomorrow, params);
    nextTime = tomorrowTimes.fajr;
  }

  const interval = setInterval(() => {
    const now = new Date();
    const diff = Math.max(0, nextTime - now);
    const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    document.getElementById("countdown").textContent = `⏳ Prochaine prière dans ${h}:${m}:${s}`;
    if (diff <= 0) clearInterval(interval);
  }, 1000);
}

// Désactiver angle/écart selon l'autre
function toggleIshaInputs() {
  const ishaInput = document.getElementById("angleIsha");
  const ishaOffset = parseInt(document.getElementById("maghribToIsha").value);
  ishaInput.disabled = ishaOffset > 0;
}

function toggleIshaOffset() {
  const ishaOffsetInput = document.getElementById("maghribToIsha");
  const ishaValue = parseFloat(document.getElementById("angleIsha").value);
  ishaOffsetInput.disabled = ishaValue > 0;
}

document.getElementById("maghribToIsha").addEventListener("input", toggleIshaInputs);
document.getElementById("angleIsha").addEventListener("input", toggleIshaOffset);

// Initialisation
window.onload = () => {
  loadCities();
  toggleIshaInputs();
  toggleIshaOffset();
  calculateTimesManual();
};
