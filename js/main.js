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
  const weatherKey = config.openweatherKey;
  const city = this.city.value;
  const url = generateUrl(weatherUrl, { q: city, units: "metric", appid: weatherKey });
  console.log(url);
  const json = getJson(url);
  console.log(json);
  renderWeather(url);

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

async function renderWeather(url) {
  const container = document.querySelector(".city-weather > .cards");
  container.innerHTML = "";

  // Hämta data
  const weather = await getJson(url);
  if (weather === null || weather === 404) {
    const title = createElement("h3");
    title.textContent = "Sorry the weather service is currently down, please try again later.";
    append(container, title);
    return;
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
  text.innerHTML = `Feels like ${data.main.feels_like}°C<br>` + `Condition: ${data.weather[0].description}<br>`;
  img.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  cardContent.append(title, img, temp, text);
  card.append(cardContent);

  return card;
}

function padDate(num) {
  return num.toString().padStart(2, 0);
}

function getDate() {
  let dateObj = new Date();
  let year = dateObj.getUTCFullYear();
  let month = padDate(dateObj.getUTCMonth());
  let date = padDate(dateObj.getUTCDate());

  return `${year}${month}${date}`;
}

function getDay(timezone) {
  let date = new Date(timezone * 1000 + Date.now());
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return weekdays[date.getUTCDay()];
}

function getTime(timezone) {
  let date = new Date(timezone * 1000 + Date.now());
  let hours = padDate(date.getUTCHours());
  let minutes = padDate(date.getUTCMinutes());

  return `${hours}:${minutes}`;
}
