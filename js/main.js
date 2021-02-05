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
    console.error("Fetch Error:", err);
  }
  return null;
}

function getCurrentDay(timezone) {
  let date = new Date(timezone * 1000 + Date.now());
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return weekdays[date.getUTCDay()];
}

function getCurrentTime(timezone) {
  let date = new Date(timezone * 1000 + Date.now());
  let hours = date.getUTCHours();
  let minutes = date.getUTCMinutes();

  hours = ("0" + hours).slice(-2);
  minutes = ("0" + minutes).slice(-2);

  return `${hours}:${minutes}`;
}

async function renderWeather(url) {
  const container = document.querySelector("#weather .cards");
  container.innerHTML = "";

  // Hämta data
  const weather = await getJson(url);
  if (weather === null || weather === 404) {
    const title = createElement("h3");
    title.textContent = "Sorry the weather service is currently down, please try again later.";
    append(container, title);
    return;
  }

  const card = createElement("div", "card");
  const cardContent = createElement("div", "card-content");
  const title = createElement("h2", "card-title");
  const temp = createElement("h3", "temp");
  const img = createElement("img");
  const text = createElement("p", "card-text");

  title.innerHTML = `${getCurrentDay(weather.timezone)} ${getCurrentTime(weather.timezone)}`;
  temp.innerHTML = `${weather.main.temp}°C<br>`;
  img.src = `http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;

  text.innerHTML += `Feels like ${weather.main.feels_like}°C<br>` + `Condition: ${weather.weather[0].description}<br>`;

  append(cardContent, title);
  append(cardContent, img);
  append(cardContent, temp);
  append(cardContent, text);
  append(card, cardContent);
  append(container, card);
}

function createElement(element, className = "") {
  const newElement = document.createElement(element);
  if (className !== "") newElement.className = className;
  return newElement;
}

function append(parent, element) {
  return parent.append(element);
}
