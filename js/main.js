"use strict";

import { config } from "./config.js";

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
  hide(".error");

  const city = this.city.value;
  const weatherChecked = this.city_options[0].checked;
  const attractionChecked = this.city_options[1].checked;
  if (city == null || city.length === 0 || (!weatherChecked && !attractionChecked)) return hide(".content > .container");

  const sort = this.city_options[2].checked;
  const category = this.categories.value;

  // Hämta data från väder-api
  const weatherData = await request(weatherUrl, {
    q: city,
    units: "metric",
    appid: config.openweatherKey,
  });

  // Hämta data från foursquare-api
  const venueData = await getVenues(city, category, sort);

  if (weatherData === null || venueData === null) {
    showErrorMsg("Sorry the service is currently down, please try again later.");
    return;
  }
  if (weatherData === 400 || venueData === 400) {
    showErrorMsg(`We are not sure where ${city} is. Try a different location.`);
    return;
  }

  // Skriv ut data i DOMen
  renderWeather(weatherData);
  renderVenues(venueData);

  show(".content > .container");

  // Scrolla ner till #city
  window.location = window.location.origin + window.location.pathname + "#city";
}

// Genererar en url med sökparametrar
function generateUrl(baseUrl, searchParams = {}) {
  let url = new URL(baseUrl);
  for (let key in searchParams) {
    url.searchParams.set(key, searchParams[key]);
  }
  return url;
}

// Ansvarar för kommunikationen med servern för att hämta data, skicka in en url och sökparameter
// async/await pausar funktionen och gör annat under tiden den väntar på svar
async function request(baseUrl, searchParams = {}) {
  const url = generateUrl(baseUrl, searchParams);
  try {
    // Kallar på servern och väntar på svar
    const response = await fetch(url);

    // Om servern fick problem returnera error
    if (!response.ok) {
      console.error("Server responded with an error, status code:", response.status);
      return 400;
    }

    // Om ok returnera svaret i json-format
    return await response.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

// Weather
// Modifera väderkortet
function renderWeather(city) {
  if (city == null || city.length === 0) return;

  const cardContent = document.querySelector(".city-weather .card-content");
  const title = cardContent.querySelector(".weather-title");
  const date = cardContent.querySelector(".weather-date");
  const img = cardContent.querySelector("img");
  const temp = cardContent.querySelector(".temp");
  const text = cardContent.querySelector("p");

  title.innerHTML = `<span class="card-title">${city.name}</span>`;
  date.innerHTML = `${getDay(city.timezone)} ${getTime(city.timezone)}`;
  img.src = `http://openweathermap.org/img/wn/${city.weather[0].icon}@2x.png`;
  temp.textContent = `${city.main.temp}°C`;
  text.innerHTML = `Feels like: ${city.main.feels_like}°C<br>` + `Condition: ${city.weather[0].description}<br>`;
}

// Attractions
// Hämta foursquare data och plocka ut viktig info i en ny array
async function getVenues(city, category, sort = false) {
  // Kallar på servern och väntar på svar
  const data = await request(foursquareUrl, {
    v: getDate(),
    near: city,
    query: category,
    sortByPopularity: 1,
    limit: 6,
    client_id: config.foursquareId,
    client_secret: config.foursquareSecret,
  });

  if (data === 400 || data == null) return data;

  const venues = data.response.groups[0].items;

  let venuesArr = [];
  let photoLimit = false;

  // Går igenom alla venues och plockar ut viktig info
  for (let key in venues) {
    const venue = venues[key].venue;
    venuesArr.push({
      id: venue.id,
      name: venue.name,
      address: venue.location.formattedAddress,
      category: venue.categories[0].name,
      icon: venue.categories[0].icon.prefix + "120" + venue.categories[0].icon.suffix,
    });

    // Hämta en bild till venue
    if (photoLimit === true) continue;
    const venuePhotos = await request(`https://api.foursquare.com/v2/venues/${venue.id}/photos`, {
      v: getDate(),
      client_id: config.foursquareId,
      client_secret: config.foursquareSecret,
    });

    if (venuePhotos === 400 || venuePhotos == null) {
      photoLimit = true;
      continue;
    }

    if (venuePhotos.response.photos.count > 0) {
      const photo = venuePhotos.response.photos.items[0];
      venuesArr[key]["img"] = `${photo.prefix}${photo.width}x${photo.height}${photo.suffix}`;
    }
  }
  if (sort === true) venuesArr.sort((a, b) => a.name.localeCompare(b.name));
  return venuesArr;
}

// Lägger till venuekort i DOMen
function renderVenues(venues) {
  if (venues == null || venues.length === 0) return;

  const container = document.querySelector(".city-attractions");
  container.innerHTML = "";

  // Skapar alla elementen till attractions
  const cardGroup = document.createElement("div");
  cardGroup.className = "cards";

  venues.forEach((item) => cardGroup.append(createVenueCard(item)));

  container.append(cardGroup);
}

function createVenueCard(data) {
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
function toggleVisibility(element) {
  const elem = document.querySelector(element);
  elem.classList.toggle("hide");
}

function show(element) {
  const elem = document.querySelector(element);
  if (elem.classList.contains("hide")) elem.classList.remove("hide");
}

function hide(element) {
  const elem = document.querySelector(element);
  if (!elem.classList.contains("hide")) elem.classList.add("hide");
}

function showErrorMsg(msg) {
  hide(".content > .container");
  const error = document.querySelector(".content > .error");
  error.querySelector(".error-message").innerHTML = msg;
  error.classList.remove("hide");
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
