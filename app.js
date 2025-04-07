// Données de villes françaises (format : nom → [lat, lon])
let citiesData = {};
fetch("cities.json").then(res => res.json()).then(data => {
  citiesData = data;
  const citySelect = document.getElementById("citySelector");
  Object.entries(data).sort().forEach(([city, coords]) => {
    const opt = document.createElement("option");
    opt.value = coords.join(",");
    opt.textContent = city;
    citySelect.appendChild(opt);
  });
});

// Appliquer le thème choisi
function applyTheme(mode) {
  const html = document.documentElement;
  const dark = mode === 'dark' || (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.classList.toggle('dark', dark);
}

// Gérer la sélection de thème
const themeSelect = document.getElementById("themeSelect");
themeSelect.addEventListener("change", () => applyTheme(themeSelect.value));
applyTheme(themeSelect.value);

// Icônes pour les prières
const prayerIcons = {
  fajr: "🕋",
  dhuhr: "🕛",
  asr: "🕒",
  maghrib: "🌇",
  isha: "🌃"
};

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function calculateTimes(coords) {
  const params = adhan.CalculationMethod.Other();
  params.fajrAngle = parseFloat(document.getElementById('angleFajr').value);
  params.ishaAngle = parseFloat(document.getElementById('angleIsha').value);
  params.maghribAngle = null;

  const ishaOffset = parseInt(document.getElementById('maghribToIsha').value);
  if (ishaOffset > 0) {
    params.ishaAngle = 0;
    params.ishaInterval = ishaOffset;
    document.getElementById("angleIsha").disabled = true;
  } else {
    document.getElementById("angleIsha").disabled = false;
  }

  const date = new Date();
  const location = new adhan.Coordinates(coords.latitude, coords.longitude);
  const prayerTimes = new adhan.PrayerTimes(location, date, params);

  const maghribTime = prayerTimes.maghrib;
  const customIsha = ishaOffset > 0 ? new Date(maghribTime.getTime() + ishaOffset * 60000) : prayerTimes.isha;

  const now = new Date();
  let current = prayerTimes.currentPrayer(now);
  let next = prayerTimes.nextPrayer(now);

  if (next === "none") {
    const tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);
    const ptNext = new adhan.PrayerTimes(location, tomorrow, params);
    next = "fajr";
    prayerTimes[next] = ptNext.fajr;
  }

  const timesDiv = document.getElementById("times");
  timesDiv.innerHTML = "";
  const cityText = document.getElementById("citySelector").selectedOptions[0]?.textContent;
  document.getElementById("cityDisplay").textContent = cityText || "";

  ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach(prayer => {
    const time = formatTime(prayer === "isha" ? customIsha : prayerTimes[prayer]);
    const div = document.createElement("div");
    div.className = "prayer-time" + (current === prayer ? " current" : "");
    div.innerHTML = `<strong>${prayerIcons[prayer]} ${prayer.charAt(0).toUpperCase() + prayer.slice(1)}</strong><span>${time}</span>`;
    timesDiv.appendChild(div);
  });

  updateCountdown(prayerTimes[next], next);
}

function updateCountdown(nextTime, label) {
  const countdown = document.getElementById("countdown");
  const now = new Date();
  const diff = Math.max(0, Math.floor((nextTime - now) / 1000));
  const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
  const seconds = (diff % 60).toString().padStart(2, '0');
  countdown.textContent = `⏳ Prochaine prière (${label}) dans : ${hours}:${minutes}:${seconds}`;
  setTimeout(() => updateCountdown(nextTime, label), 1000);
}

function calculateTimesManual() {
  const lat = parseFloat(document.getElementById('latitude').value);
  const lon = parseFloat(document.getElementById('longitude').value);
  calculateTimes({ latitude: lat, longitude: lon });
}

document.getElementById("gpsBtn").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      document.getElementById("latitude").value = latitude.toFixed(4);
      document.getElementById("longitude").value = longitude.toFixed(4);
      calculateTimes({ latitude, longitude });

      // Trouver la ville la plus proche
      let closest = null;
      let minDist = Infinity;
      for (const [city, [clat, clon]] of Object.entries(citiesData)) {
        const dist = Math.hypot(latitude - clat, longitude - clon);
        if (dist < minDist) {
          closest = city;
          minDist = dist;
        }
      }
      if (closest) {
        const coords = citiesData[closest];
        document.getElementById("citySelector").value = coords.join(",");
        document.getElementById("cityDisplay").textContent = closest;
        document.getElementById("countrySelector").value = "France";
      }
    }, err => alert("Erreur GPS : " + err.message));
  } else {
    alert("Géolocalisation non supportée");
  }
});
