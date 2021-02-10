"use strict";

// api urls
const weatherUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
const foursquareUrl = new URL("https://api.foursquare.com/v2/venues/explore");

// När sidan laddats kör eventet
window.addEventListener("DOMContentLoaded", onPageLoad);
function onPageLoad() {
  const cityForm = document.querySelector("#city-form");
  cityForm.addEventListener("submit", onCitySearch);

  // const weatherOption = cityForm.city_options[0];
  // const attractionOption = cityForm.city_options[1];
  // console.log(weatherOption);
  // weatherOption.onchange = weatherContainer.classList.toggle("hide");
  const weatherCb = cityForm.city_options[0];
  const attractionCb = cityForm.city_options[1];

  weatherCb.onchange = () => {
    toggleVisibility(".city-weather");
  };

  attractionCb.onchange = () => {
    toggleVisibility(".city-attractions");
  };
}

function toggleVisibility(element) {
  const elem = document.querySelector(element);
  elem.classList.toggle("hide");
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
}

function errorMsg(msg) {
  document.querySelector(".city-attractions").innerHTML = "";
  const container = document.querySelector(".city-weather > .cards");
  container.innerHTML = "";
  const title = document.createElement("h3");
  title.innerHTML = msg;
  container.append(title);
}

// Genererar en url med sökparametrar
function generateUrl(baseUrl, searchArgs) {
  let url = new URL(baseUrl);
  for (let key in searchArgs) {
    url.searchParams.set(key, searchArgs[key]);
  }
  return url;
}

// Hämta data från url
async function getJson(url, searchParams) {
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

async function getWeatherData(city) {
  const weatherKey = config.openweatherKey;
  const url = generateUrl(weatherUrl, { q: city, units: "metric", appid: weatherKey });

  // Hämta data
  const weather = await getJson(url);
  return weather;
}

// Weather
function renderWeather(weatherData) {
  const container = document.querySelector(".city-weather > .cards");
  container.innerHTML = "";

  container.append(createWeatherCard(weatherData));
}

function createWeatherCard(data) {
  const card = document.createElement("div");
  card.className = "card";

  const img = document.createElement("img");
  // img.className = "card-img";

  const cardContent = document.createElement("div");
  cardContent.className = "card-content";

  const title = document.createElement("h2");
  const temp = document.createElement("h3");
  temp.className = "temp";
  const text = document.createElement("p");

  title.textContent = `${getDay(data.timezone)} ${getTime(data.timezone)}`;
  temp.textContent = `${data.main.temp}°C`;
  text.innerHTML = `Feels like ${data.main.feels_like}°C<br>` + `Condition ${data.weather[0].description}<br>`;
  img.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  cardContent.append(title, img, temp, text);
  card.append(cardContent);

  return card;
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
    limit: 10,
  });

  // Hämta data
  const cityJson = await getJson(url);

  if (cityJson === 400 || cityJson === null) return cityJson;

  const cityItems = cityJson.response.groups[0].items;
  let cityArr = [];
  for (let key in cityItems) {
    const city = cityItems[key];
    cityArr.push({
      id: city.venue.id,
      name: city.venue.name,
      address: city.venue.location.formattedAddress,
      category: city.venue.categories[0].name,
      img: city.venue.categories[0].icon.prefix + "120" + city.venue.categories[0].icon.suffix,
    });
  }
  return cityArr;
}

// Lägg till atraction card i DOMen
function renderAttractions(cityData, sort) {
  const container = document.querySelector(".city-attractions");
  container.innerHTML = "";

  if (sort === true) cityData.sort((a, b) => a.name.localeCompare(b.name));
  // console.time("createElement");

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

  img.src = data.img;
  title.textContent = data.name;
  text.innerHTML = `<strong>${data.category}</strong><br>` + data.address.join("<br>");

  return card;
}

// Utility
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
