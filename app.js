
let citiesData = {};
let currentTheme = "auto";
let currentLang = "fr";

function loadCities() {
  fetch("cities.json")
    .then(res => res.json())
    .then(data => {
      citiesData = data;
      const countrySelector = document.getElementById("countrySelector");
      const citySelector = document.getElementById("citySelector");
      countrySelector.innerHTML = '<option value="">-- Choisir un pays --</option>';

      Object.keys(citiesData).sort().forEach(country => {
        const opt = document.createElement("option");
        opt.value = country;
        opt.textContent = country;
        countrySelector.appendChild(opt);
      });

      countrySelector.addEventListener("change", () => {
        const selectedCountry = countrySelector.value;
        citySelector.innerHTML = '<option value="">-- Choisir une ville --</option>';
        if (citiesData[selectedCountry]) {
          Object.keys(citiesData[selectedCountry]).sort().forEach(city => {
            const opt = document.createElement("option");
            opt.value = city;
            opt.textContent = city;
            citySelector.appendChild(opt);
          });
        }
      });

      citySelector.addEventListener("change", () => {
        const selectedCountry = countrySelector.value;
        const selectedCity = citySelector.value;
        if (citiesData[selectedCountry] && citiesData[selectedCountry][selectedCity]) {
          const [lat, lon] = citiesData[selectedCountry][selectedCity];
          document.getElementById("latitude").value = lat;
          document.getElementById("longitude").value = lon;
          document.getElementById("cityDisplay").textContent = selectedCity;
          calculateTimesManual();
        }
      });
    });
}

function distance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function detectLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    document.getElementById("latitude").value = latitude.toFixed(4);
    document.getElementById("longitude").value = longitude.toFixed(4);
    let closest = { country: "", city: "", dist: Infinity };
    for (const country in citiesData) {
      for (const city in citiesData[country]) {
        const [clat, clon] = citiesData[country][city];
        const d = distance(latitude, longitude, clat, clon);
        if (d < closest.dist) {
          closest = { country, city, dist: d };
        }
      }
    }
    if (closest.city) {
      document.getElementById("countrySelector").value = closest.country;
      const evt = new Event("change");
      document.getElementById("countrySelector").dispatchEvent(evt);
      setTimeout(() => {
        document.getElementById("citySelector").value = closest.city;
        document.getElementById("citySelector").dispatchEvent(new Event("change"));
      }, 200);
    }
  }, err => {
    alert("Erreur GPS : " + err.message);
  });
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function calculateTimesManual() {
  const lat = parseFloat(document.getElementById("latitude").value);
  const lon = parseFloat(document.getElementById("longitude").value);
  calculateTimes({ latitude: lat, longitude: lon });
}

function calculateTimes(coords) {
  const angleFajr = parseFloat(document.getElementById("angleFajr").value);
  const angleIsha = parseFloat(document.getElementById("angleIsha").value);
  const ishaInterval = parseFloat(document.getElementById("maghribToIsha").value);
  const params = adhan.CalculationMethod.Other();
  params.fajrAngle = angleFajr;
  params.ishaAngle = ishaInterval > 0 ? 0 : angleIsha;
  params.ishaInterval = ishaInterval > 0 ? ishaInterval : 0;

  const date = new Date();
  const location = new adhan.Coordinates(coords.latitude, coords.longitude);
  const prayerTimes = new adhan.PrayerTimes(location, date, params);

  const maghribTime = prayerTimes.maghrib;
  const customIsha = ishaInterval > 0 ? new Date(maghribTime.getTime() + ishaInterval * 60000) : prayerTimes.isha;

  const timesDiv = document.getElementById("times");
  const prayers = {
    Fajr: prayerTimes.fajr,
    Dhuhr: prayerTimes.dhuhr,
    Asr: prayerTimes.asr,
    Maghrib: prayerTimes.maghrib,
    Isha: customIsha
  };

  let current = "Isha", next = "Fajr", now = new Date();
  const keys = Object.keys(prayers);
  for (let i = 0; i < keys.length; i++) {
    if (now < prayers[keys[i]]) {
      current = keys[i - 1] || "Isha";
      next = keys[i];
      break;
    }
  }

  timesDiv.innerHTML = "";
  keys.forEach(prayer => {
    const div = document.createElement("div");
    div.className = "prayer-time";
    if (prayer === current) div.classList.add("active");
    const icon = prayer === "Fajr" ? "🕋" : prayer === "Dhuhr" ? "🕛" : prayer === "Asr" ? "🕒" : prayer === "Maghrib" ? "🌇" : "🌙";
    div.innerHTML = `<strong>${icon} ${prayer}</strong><span>${formatTime(prayers[prayer])}</span>`;
    timesDiv.appendChild(div);
  });

  document.getElementById("cityDisplay").textContent = document.getElementById("citySelector").value;
  startCountdown(prayers[next], next);
}

function startCountdown(nextTime, nextLabel) {
  const countdownDiv = document.getElementById("countdown");
  const update = () => {
    const now = new Date();
    const diff = nextTime - now;
    if (diff <= 0) return countdownDiv.textContent = "🔄 Mise à jour...";
    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor(diff % 3600000 / 60000)).padStart(2, "0");
    const s = String(Math.floor(diff % 60000 / 1000)).padStart(2, "0");
    countdownDiv.textContent = `⏳ ${h}:${m}:${s} avant ${nextLabel}`;
  };
  update();
  setInterval(update, 1000);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function changeTheme() {
  const selected = document.getElementById("themeSelect").value;
  applyTheme(selected === "auto" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : selected);
}

function changeLang() {
  const selected = document.getElementById("langSelect").value;
  currentLang = selected;
  // Ajoute ici la logique multilingue si nécessaire
}

window.onload = () => {
  loadCities();
  detectLocation();
  document.getElementById("themeSelect").addEventListener("change", changeTheme);
  document.getElementById("langSelect").addEventListener("change", changeLang);
  changeTheme();
  changeLang();
};
