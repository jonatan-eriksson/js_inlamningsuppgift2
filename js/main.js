window.addEventListener("DOMContentLoaded", onPageLoad);

function onPageLoad() {
  const cityForm = document.querySelector("#city-form");
  cityForm.addEventListener("submit", onCitySearch);
}

function onCitySearch(e) {
  // const citySearch = document.querySelector("#city-search").value;
  alert("City submitted " + this.city.value);
  e.preventDefault();
}
