"use strict";

// api urls
const weatherUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
const foursquareUrl = new URL("https://api.foursquare.com/v2/venues/explore");

// När sidan laddats kör eventet
window.addEventListener("DOMContentLoaded", onPageLoad);
function onPageLoad() {
  const cityForm = document.querySelector("#city-form");
  cityForm.addEventListener("submit", onCitySearch);

  const weatherCb = cityForm.city_options[0];
  const attractionCb = cityForm.city_options[1];

  weatherCb.onchange = () => {
    toggleVisibility(".city-weather");
  };

  attractionCb.onchange = () => {
    toggleVisibility(".city-attractions");
  };
}

async function onCitySearch(e) {
  e.preventDefault();
  const city = this.city.value;

  const filterCb = this.city_options[2];

  let weatherData = await getWeatherData(city);
  let attractionData = await getAttractionData(city);

  if (weatherData === null || attractionData === null) {
    errorMsg("Sorry the service is currently down, please try again later.");
    return;
  }
  if (weatherData === 400 || attractionData === 400) {
    errorMsg(`We are not sure where ${city} is. Try a different location.`);
    return;
  }

  renderWeather(weatherData);
  filterCb.checked ? renderAttractions(attractionData, true) : renderAttractions(attractionData, false);

  const container = document.querySelector(".content > .container");
  if (container.classList.contains("first-search")) container.classList.remove("first-search");
}

// Weather
async function getWeatherData(city) {
  const weatherKey = config.openweatherKey;
  const url = generateUrl(weatherUrl, { q: city, units: "metric", appid: weatherKey });

  // Hämta data
  const weather = await getJson(url);
  return weather;
}

function renderWeather(data) {
  const cardContent = document.querySelector(".city-weather .card-content");
  const title = cardContent.querySelector(".weather-title");
  const date = cardContent.querySelector(".weather-date");
  const img = cardContent.querySelector("img");
  const temp = cardContent.querySelector(".temp");
  const text = cardContent.querySelector("p");

  title.innerHTML = `<span class="card-title">${data.name}</span>`;
  date.innerHTML = `${getDay(data.timezone)} ${getTime(data.timezone)}`;
  img.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  temp.textContent = `${data.main.temp}°C`;
  text.innerHTML = `Feels like: ${data.main.feels_like}°C<br>` + `Condition: ${data.weather[0].description}<br>`;
}

// Attractions
// Hämta foursquare data och plocka ut viktig info i en ny array
async function getAttractionData(city) {
  const id = config.foursquareId;
  const secret = config.foursquareSecret;

  const url = generateUrl(foursquareUrl, {
    v: getDate(),
    client_id: id,
    client_secret: secret,
    near: city,
    venuePhotos: 1,
    sortByPopularity: 1,
    // query: cat,
    limit: 6,
  });

  // Hämta data
  const cityJson = await getJson(url);
  if (cityJson === 400 || cityJson === null) return cityJson;
  const cityItems = cityJson.response.groups[0].items;

  let cityArr = [];
  let photoLimit = false;

  for (let key in cityItems) {
    const venue = cityItems[key].venue;
    cityArr.push({
      id: venue.id,
      name: venue.name,
      address: venue.location.formattedAddress,
      category: venue.categories[0].name,
      icon: venue.categories[0].icon.prefix + "120" + venue.categories[0].icon.suffix,
    });

    // Hämta en bild till varje venue
    if (photoLimit === false) {
      const photoUrl = generateUrl(`https://api.foursquare.com/v2/venues/${venue.id}/photos`, {
        v: getDate(),
        client_id: id,
        client_secret: secret,
      });
      const venuePhotos = await getJson(photoUrl);
      if (venuePhotos === 400 || venuePhotos === null) {
        photoLimit = true;
        continue;
      }

      if (venuePhotos.response.photos.count > 0) {
        const photo = venuePhotos.response.photos.items[0];
        cityArr[key]["img"] = `${photo.prefix}${photo.width}x${photo.height}${photo.suffix}`;
      }
    }
  }

  return cityArr;
}

// Lägg till attraction card i DOMen
function renderAttractions(cityData, sort) {
  const container = document.querySelector(".city-attractions");
  container.innerHTML = "";

  if (sort === true) cityData.sort((a, b) => a.name.localeCompare(b.name));
  // console.time("createElement");

  // Skapar alla elementen till attractions
  const cardGroup = document.createElement("div");
  cardGroup.className = "cards";
  cityData.forEach((item) => cardGroup.append(createAttractionCard(item)));
  container.append(cardGroup);

  // console.timeEnd("createElement");
}

// Skapa attraction card för varje sevärdhet
function createAttractionCard(data) {
  const card = document.createElement("div");
  card.className = "card";

  const img = document.createElement("img");
  img.className = "card-img";

  const cardContent = document.createElement("div");
  cardContent.className = "card-content";

  const title = document.createElement("h2");
  const text = document.createElement("p");

  cardContent.append(title, text);
  card.append(img, cardContent);

  if (data.img) {
    img.src = data.img;
  } else {
    img.className += " card-icon";
    img.src = data.icon;
  }
  title.textContent = data.name;
  text.innerHTML = `<strong>${data.category}</strong><br>` + data.address.join("<br>");

  return card;
}

// Utility

// Genererar en url med sökparametrar
function generateUrl(baseUrl, searchArgs) {
  let url = new URL(baseUrl);
  for (let key in searchArgs) {
    url.searchParams.set(key, searchArgs[key]);
  }
  return url;
}

// Hämta data från api
async function getJson(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Server responded with an error, status code:", response.status);
      return 400;
    }

    return await response.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

function toggleVisibility(element) {
  const elem = document.querySelector(element);
  elem.classList.toggle("hide");
}

function errorMsg(msg) {
  document.querySelector(".city-attractions").innerHTML = "";
  const container = document.querySelector(".city-weather > .cards");
  container.innerHTML = "";
  const title = document.createElement("h3");
  title.innerHTML = msg;
  container.append(title);
}

function padDate(num) {
  return num.toString().padStart(2, 0);
}

function getDate() {
  const dateObj = new Date();
  const year = dateObj.getUTCFullYear();
  const month = padDate(dateObj.getUTCMonth() + 1);
  const date = padDate(dateObj.getUTCDate());

  return `${year}${month}${date}`;
}

function getDay(timezone) {
  const date = new Date(timezone * 1000 + Date.now());
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return weekdays[date.getUTCDay()];
}

function getTime(timezone) {
  const date = new Date(timezone * 1000 + Date.now());
  const hours = padDate(date.getUTCHours());
  const minutes = padDate(date.getUTCMinutes());

  return `${hours}:${minutes}`;
}
