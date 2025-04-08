
let citiesData = {};

fetch("cities.json")
  .then(res => res.json())
  .then(data => {
    citiesData = data;
    const countrySelect = document.getElementById("countrySelector");
    Object.keys(data).sort().forEach(country => {
      const opt = document.createElement("option");
      opt.value = country;
      opt.textContent = country;
      countrySelect.appendChild(opt);
    });
  });

document.getElementById("countrySelector").addEventListener("change", e => {
  populateCities(e.target.value);
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

document.getElementById("citySelector").addEventListener("change", () => {
  const country = document.getElementById("countrySelector").value;
  const city = document.getElementById("citySelector").value;
  if (citiesData[country] && citiesData[country][city]) {
    const [lat, lon] = citiesData[country][city];
    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lon;
    calculateTimes({ latitude: lat, longitude: lon });
    document.getElementById("cityDisplay").textContent = city;
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
            const [lat, lon] = citiesData[closestCountry][closestCity];
            calculateTimes({ latitude: lat, longitude: lon });
          }, 150);
        } else {
          calculateTimes({ latitude, longitude });
        }

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
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
