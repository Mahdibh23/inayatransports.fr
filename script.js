const europeanCountries = [
  "AL",
  "AD",
  "AT",
  "BY",
  "BE",
  "BA",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IS",
  "IE",
  "IT",
  "XK",
  "LV",
  "LI",
  "LT",
  "LU",
  "MT",
  "MD",
  "MC",
  "ME",
  "NL",
  "MK",
  "NO",
  "PL",
  "PT",
  "RO",
  "RU",
  "SM",
  "RS",
  "SK",
  "SI",
  "ES",
  "SE",
  "CH",
  "UA",
  "GB",
  "VA",
];

const CityTripCalculator = (() => {
  let citiesData = null;
  let cityIndex = new Map();

  const normalizeCityName = (name) =>
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/,.*/g, ""); // Remove region or country info (e.g., "Paris, France" -> "Paris")

  const loadCitiesData = async () => {
    const cachedData = localStorage.getItem("citiesData");
    if (cachedData) {
      citiesData = JSON.parse(cachedData);
      cityIndex.clear();
      citiesData.forEach((city) => {
        const normalizedName = normalizeCityName(city.city_ascii);
        const existing = cityIndex.get(normalizedName) || [];
        existing.push(city);
        cityIndex.set(normalizedName, existing);
      });
      updateCitySuggestions();
      console.log(
        "Villes européennes chargées depuis le cache:",
        citiesData.length
      );
      console.log(
        "Exemple de villes:",
        citiesData.slice(0, 5).map((c) => c.city_ascii)
      );
      return;
    }

    if (typeof Papa === "undefined") {
      console.error("Papa Parse n'est pas chargé.");
      showError(
        "Erreur : Impossible de charger les données. Bibliothèque manquante."
      );
      return;
    }

    try {
      const response = await fetch("./worldcities.csv");
      if (!response.ok) throw new Error("Fichier CSV introuvable");
      const data = await response.text();
      Papa.parse(data, {
        header: true,
        complete: (results) => {
          console.log("Données brutes CSV:", results.data.slice(0, 5));
          citiesData = results.data.filter((city) => {
            const isValid =
              europeanCountries.includes(city.iso2) &&
              city.city_ascii &&
              city.lat &&
              city.lng &&
              !isNaN(parseFloat(city.lat)) &&
              !isNaN(parseFloat(city.lng));
            if (!isValid) {
              console.log(`Ville filtrée: ${city.city_ascii || "inconnue"}`, {
                iso2: city.iso2,
                city_ascii: city.city_ascii,
                lat: city.lat,
                lng: city.lng,
              });
            }
            return isValid;
          });

          if (
            !citiesData.some(
              (city) => normalizeCityName(city.city_ascii) === "paris"
            )
          ) {
            console.error("Paris non trouvé dans les données filtrées!");
          }
          if (
            !citiesData.some(
              (city) => normalizeCityName(city.city_ascii) === "lyon"
            )
          ) {
            console.error("Lyon non trouvé dans les données filtrées!");
          }

          cityIndex.clear();
          citiesData.forEach((city) => {
            const normalizedName = normalizeCityName(city.city_ascii);
            const existing = cityIndex.get(normalizedName) || [];
            existing.push(city);
            cityIndex.set(normalizedName, existing);
          });

          localStorage.setItem("citiesData", JSON.stringify(citiesData));
          updateCitySuggestions();
          console.log("Villes européennes chargées:", citiesData.length);
          console.log(
            "Exemple de villes:",
            citiesData.slice(0, 5).map((c) => c.city_ascii)
          );
        },
        error: (error) => {
          console.error("Erreur lors du parsing du CSV:", error);
          showError("Erreur lors du chargement des données des villes.");
        },
      });
    } catch (error) {
      console.error("Erreur lors du chargement du fichier CSV:", error);
      showError("Erreur lors du chargement des données des villes.");
    }
  };

  const countryCodeToName = (iso2) => {
    const countryMap = {
      AL: "Albania",
      AD: "Andorra",
      AT: "Austria",
      BY: "Belarus",
      BE: "Belgium",
      BA: "Bosnia and Herzegovina",
      BG: "Bulgaria",
      HR: "Croatia",
      CY: "Cyprus",
      CZ: "Czech Republic",
      DK: "Denmark",
      EE: "Estonia",
      FI: "Finland",
      FR: "France",
      DE: "Germany",
      GR: "Greece",
      HU: "Hungary",
      IS: "Iceland",
      IE: "Ireland",
      IT: "Italy",
      XK: "Kosovo",
      LV: "Latvia",
      LI: "Liechtenstein",
      LT: "Lithuania",
      LU: "Luxembourg",
      MT: "Malta",
      MD: "Moldova",
      MC: "Monaco",
      ME: "Montenegro",
      NL: "Netherlands",
      MK: "North Macedonia",
      NO: "Norway",
      PL: "Poland",
      PT: "Portugal",
      RO: "Romania",
      RU: "Russia",
      SM: "San Marino",
      RS: "Serbia",
      SK: "Slovakia",
      SI: "Slovenia",
      ES: "Spain",
      SE: "Sweden",
      CH: "Switzerland",
      UA: "Ukraine",
      GB: "United Kingdom",
      VA: "Vatican City",
    };
    return countryMap[iso2] || iso2;
  };

  const updateCitySuggestions = () => {
    const departDatalist = document.querySelector("#depart-suggestions");
    const arriveeDatalist = document.querySelector("#arrivee-suggestions");
    if (!departDatalist || !arriveeDatalist) {
      console.error("Datalist non trouvé!");
      return;
    }
    departDatalist.innerHTML = "";
    arriveeDatalist.innerHTML = "";
    if (!citiesData) {
      console.error("Aucune donnée de ville pour les suggestions!");
      return;
    }
    citiesData.forEach((city) => {
      const option = document.createElement("option");
      option.value = city.city_ascii; // User inputs city name only
      option.textContent = `${city.city_ascii}, ${countryCodeToName(
        city.iso2
      )}`; // Display city, country
      departDatalist.appendChild(option);
      arriveeDatalist.appendChild(option.cloneNode(true));
    });
    console.log(
      "Suggestions mises à jour pour",
      citiesData.length,
      "villes avec pays"
    );
  };

  const showError = (message) => {
    const existingError = document.querySelector(".error-message");
    if (existingError) existingError.remove();
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    const calculateBtn = document.querySelector(".calculate-btn");
    if (calculateBtn) {
      calculateBtn.parentNode.insertBefore(errorDiv, calculateBtn.nextSibling);
    } else {
      document.querySelector(".reservation-form")?.prepend(errorDiv);
    }
    setTimeout(() => errorDiv.remove(), 5000);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findCityCoordinates = (cityName) => {
    if (!citiesData) {
      console.error("Données des villes non chargées");
      showError("Données des villes non chargées. Veuillez réessayer.");
      return null;
    }
    const normalizedName = normalizeCityName(cityName);
    const matches = cityIndex.get(normalizedName);
    if (!matches) {
      console.error(
        `Ville non trouvée: ${cityName} (normalisé: ${normalizedName})`
      );
      return null;
    }
    const city =
      matches.find((c) => c.iso2 === "FR") ||
      matches.find((c) => europeanCountries.includes(c.iso2)) ||
      matches[0];
    if (city) {
      console.log(
        `Ville trouvée: ${city.city_ascii}, Coordonnées: ${city.lat}, ${city.lng}, iso2: ${city.iso2}`
      );
      return { lat: parseFloat(city.lat), lng: parseFloat(city.lng) };
    }
    console.error(
      `Ville non trouvée: ${cityName} (normalisé: ${normalizedName})`
    );
    return null;
  };

  const calculateTariff = (distance, vehicleType, option) => {
    const baseFare = 10;
    const validVehicleTypes = ["Berline", "Hybride", "Van"];
    if (!validVehicleTypes.includes(vehicleType)) {
      showError("Type de véhicule invalide.");
      return null;
    }
    const pricePerKm = {
      Berline: 1.8,
      Hybride: 2.0,
      Van: 2.3,
    }[vehicleType];
    const adjustedDistance = distance * 1.15;
    let total = baseFare + adjustedDistance * pricePerKm;
    if (option === "baby-seat" || option === "booster-seat") {
      total += 5;
    }
    return total.toFixed(2);
  };

  const init = () => {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");
    const header = document.querySelector("header");
    hamburger?.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      const icon = hamburger.querySelector("i");
      icon.classList.toggle("fa-bars");
      icon.classList.toggle("fa-times");
    });

    document.querySelectorAll(".nav-menu a").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
        const icon = hamburger.querySelector("i");
        icon.classList.remove("fa-times");
        icon.classList.add("fa-bars");
      });
    });

    const debounce = (func, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
      };
    };
    window.addEventListener(
      "scroll",
      debounce(() => {
        if (window.scrollY > 50) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }
      }, 10)
    );

    const vehicleButtons = document.querySelectorAll(".vehicle-btn");
    const vehicleInput = document.querySelector("#vehicle-type");
    vehicleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        vehicleButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        vehicleInput.value = button.dataset.vehicle;
      });
    });

    const optionButtons = document.querySelectorAll(".option-btn");
    let selectedOption = "none";
    optionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        optionButtons.forEach((btn) =>
          btn.classList.remove("bg-blue-500", "text-white")
        );
        button.classList.add("bg-blue-500", "text-white");
        selectedOption = button.dataset.option;
      });
    });

    const calculateBtn = document.querySelector(".calculate-btn");
    const resultsContainer = document.querySelector(".results-container");
    const distanceInput = document.querySelector("#distance");
    const durationInput = document.querySelector("#duration");
    const priceInput = document.querySelector("#estimatedPrice");

    calculateBtn?.addEventListener("click", () => {
      const depart = document.querySelector("#depart")?.value;
      const arrivee = document.querySelector("#arrivee")?.value;
      const vehicleType = vehicleInput?.value;

      if (!vehicleType) {
        showError("Veuillez sélectionner un type de véhicule.");
        return;
      }

      if (!citiesData) {
        showError(
          "Données des villes en cours de chargement. Veuillez patienter."
        );
        return;
      }

      const departCoords = findCityCoordinates(depart);
      const arriveeCoords = findCityCoordinates(arrivee);

      if (!departCoords && !arriveeCoords) {
        showError(translations[currentLanguage].error_both_cities);
        return;
      }

      if (!departCoords) {
        showError(translations[currentLanguage].error_departure_city);
        return;
      }

      if (!arriveeCoords) {
        showError(translations[currentLanguage].error_arrival_city);
        return;
      }

      const distance = calculateDistance(
        departCoords.lat,
        departCoords.lng,
        arriveeCoords.lat,
        arriveeCoords.lng
      );
      const duration = distance / 80;
      const hours = Math.floor(duration);
      const minutes = Math.round((duration - hours) * 60);
      const price = calculateTariff(distance, vehicleType, selectedOption);

      if (price === null) return;

      distanceInput.value = `${Math.round(distance)} km`;
      durationInput.value = `${hours}h ${minutes}min`;
      priceInput.value = `${price} €`;
      resultsContainer.style.display = "block";
    });

    loadCitiesData();
  };

  return { init };
})();

CityTripCalculator.init();
