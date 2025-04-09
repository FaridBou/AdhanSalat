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
  countrySelect.innerHTML = '<option value="">-- Choisir un pays --</option>';
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
        option.value = [lat, lon].join(",");
        option.textContent = city;
        citySelect.appendChild(option);
      });
  }
});

document.getElementById("citySelector").addEventListener("change", () => {
  const value = document.getElementById("citySelector").value;
  if (value) {
    const [lat, lon] = value.split(",");
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lon;
    updateTimes();
  }
});

document.getElementById("gpsBtn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Géolocalisation non supportée");
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude.toFixed(4);
    const lon = pos.coords.longitude.toFixed(4);
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lon;

    // Trouver la ville la plus proche
    let closest = null;
    let minDist = Infinity;
    for (const [country, cities] of Object.entries(citiesData)) {
      for (const [city, [clat, clon]] of Object.entries(cities)) {
        const d = distance(lat, lon, clat, clon);
        if (d < minDist) {
          minDist = d;
          closest = { country, city, lat: clat, lon: clon };
        }
      }
    }
    if (closest) {
      currentCountry = closest.country;
      currentCity = closest.city;
      document.getElementById("countrySelector").value = closest.country;
      document.getElementById("citySelector").innerHTML = "";
      Object.entries(citiesData[closest.country])
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([city, [lat, lon]]) => {
          const option = document.createElement("option");
          option.value = [lat, lon].join(",");
          option.textContent = city;
          if (city === closest.city) option.selected = true;
          document.getElementById("citySelector").appendChild(option);
        });
      updateTimes();
    }
  });
});

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function updateIshaControls() {
  const angle = parseFloat(document.getElementById("angleIsha").value);
  const offset = parseInt(document.getElementById("maghribToIsha").value);

  if (offset > 0) {
    document.getElementById("angleIsha").disabled = true;
    document.getElementById("maghribToIsha").disabled = false;
  } else if (angle > 0) {
    document.getElementById("angleIsha").disabled = false;
    document.getElementById("maghribToIsha").disabled = true;
  } else {
    // aucun renseigné, tout actif
    document.getElementById("angleIsha").disabled = false;
    document.getElementById("maghribToIsha").disabled = false;
  }
}

document.getElementById("maghribToIsha").addEventListener("input", updateIshaControls);
document.getElementById("angleIsha").addEventListener("input", updateIshaControls);

function calculateNextPrayer(now, times) {
  const ordered = [
    { name: "fajr", time: times.fajr },
    { name: "dhuhr", time: times.dhuhr },
    { name: "asr", time: times.asr },
    { name: "maghrib", time: times.maghrib },
    { name: "isha", time: times.isha }
  ];
  for (let i = 0; i < ordered.length; i++) {
    if (now < ordered[i].time) {
      return { next: ordered[i], after: ordered[(i + 1) % ordered.length] };
    }
  }
  return { next: ordered[0], after: ordered[1] }; // Après Isha
}

function updateTimes() {
  const lat = parseFloat(document.getElementById("latitude").value);
  const lon = parseFloat(document.getElementById("longitude").value);
  const angleFajr = parseFloat(document.getElementById("angleFajr").value);
  const angleIsha = parseFloat(document.getElementById("angleIsha").value);
  const ishaOffset = parseInt(document.getElementById("maghribToIsha").value);
  const date = new Date();

  const params = adhan.CalculationMethod.Other();
  params.fajrAngle = angleFajr;
  if (ishaOffset > 0) {
    params.ishaInterval = ishaOffset;
    params.ishaAngle = 0;
  } else {
    params.ishaAngle = angleIsha;
  }

  const coords = new adhan.Coordinates(lat, lon);
  const prayerTimes = new adhan.PrayerTimes(coords, date, params);

  const times = {
    fajr: prayerTimes.fajr,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: ishaOffset > 0
      ? new Date(prayerTimes.maghrib.getTime() + ishaOffset * 60000)
      : prayerTimes.isha
  };

  const icons = {
    fajr: "🕋", dhuhr: "🕛", asr: "🕒", maghrib: "🌇", isha: "🌃"
  };

  const now = new Date();
  const { next } = calculateNextPrayer(now, times);

  console.log("Prochaine prière :", next.name, "à", next.time);

  document.getElementById("cityDisplay").textContent = currentCity || "";

  const list = Object.entries(times).map(([name, time]) => {
    const timeStr = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const isNext = name === next.name;
    return `<div class="prayer-time ${isNext ? "current" : ""}"><strong>${icons[name]} ${name.charAt(0).toUpperCase() + name.slice(1)}</strong><span>${timeStr}</span></div>`;
  }).join("");

  document.getElementById("times").innerHTML = list;

  // Countdown
  const countdownEl = document.getElementById("countdown");
  const updateCountdown = () => {
    const now = new Date();
    const diff = Math.max(0, next.time - now);
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    countdownEl.innerHTML = `⏳ Prochaine prière (${next.name.charAt(0).toUpperCase() + next.name.slice(1)}) dans ${mins}m ${secs}s`;
  };
  updateCountdown();
  clearInterval(window.countdownInterval);
  window.countdownInterval = setInterval(updateCountdown, 1000);
}

window.calculateTimesManual = updateTimes;
window.onload = () => {
  loadCities();
  updateIshaControls();
};
