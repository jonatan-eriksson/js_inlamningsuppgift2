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

  e.preventDefault();
}

function generateUrl(baseUrl, searchArgs) {
  let url = new URL(baseUrl);
  for (let key in searchArgs) {
    url.searchParams.set(key, searchArgs[key]);
  }
  return url;
}
