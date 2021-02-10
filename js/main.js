"use strict";

// api urls
const weatherUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
const foursquareUrl = new URL("https://api.foursquare.com/v2/venues/explore");

// När sidan laddats kör eventet
window.addEventListener("DOMContentLoaded", onPageLoad);
function onPageLoad() {
  const cityForm = document.querySelector("#city-form");
  cityForm.addEventListener("submit", onCitySearch);
}

function onCitySearch(e) {
  // const citySearch = document.querySelector("#city-search").value;
  const city = this.city.value;

  renderWeather(city);
  renderAttractions(city);

  e.preventDefault();
}

function generateUrl(baseUrl, searchArgs) {
  let url = new URL(baseUrl);
  for (let key in searchArgs) {
    url.searchParams.set(key, searchArgs[key]);
  }
  return url;
}

async function getJson(url = "") {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    } else {
      console.error("Status code:", response.status);
      return response.status;
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
  return null;
}

async function renderWeather(city) {
  const container = document.querySelector(".city-weather > .cards");
  container.innerHTML = "";

  const weatherKey = config.openweatherKey;
  const url = generateUrl(weatherUrl, { q: city, units: "metric", appid: weatherKey });

  // Hämta data
  const weather = await getJson(url);
  if (weather === 400) return weather.status;
  if (weather === null) {
    const title = createElement("h3");
    title.textContent = "Sorry the weather service is currently down, please try again later.";
    append(container, title);
    return null;
  }

  container.append(createWeatherCard(weather));
}

function createWeatherCard(data) {
  console.log(data);
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

async function renderAttractions(city, sort) {
  const container = document.querySelector(".city-attractions");
  container.innerHTML = "";

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

  // if (cityJson === 400) return cityJson;
  // if (cityJson === null) return null;

  console.log(cityJson);
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
  sort = true;
  if (sort === true) cityArr.sort((a, b) => a.name.localeCompare(b.name));
  // console.time("createElement");

  const cardGroup = document.createElement("div");
  cardGroup.className = "cards";
  cityArr.forEach((item) => cardGroup.append(createAttractionCard(item)));
  container.append(cardGroup);

  // console.timeEnd("createElement");
}

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

function padDate(num) {
  return num.toString().padStart(2, 0);
}

function getDate() {
  const dateObj = new Date();
  const year = dateObj.getUTCFullYear();
  const month = padDate(dateObj.getUTCMonth());
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
