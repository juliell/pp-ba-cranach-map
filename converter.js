const axios = require('axios');
const fs = require('fs');
const config = require('./config');

console.log('converter started');

async function loadPaintings() {
  const response = await axios.get(config.paintingsUrl);
  return response.data;
}

async function buildJSONStructure() {
  // request for githubJson of paintings
  const paintings = await loadPaintings();
  // übernahme der relevanten Eigenschaften
  return paintings.items.map((item) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [],
    },
    properties: {
      objectID: item.objectId,
      classification: item.classification.classification,
      titles: item.titles[0].title,
      dated: item.dating.dated,
      location: item.locations[0].term.toLowerCase() === 'wittenberg' ? `${item.locations[0].term}, Lutherstadt` : item.locations[0].term,
      repository: item.repository,
      owner: item.owner,
    },
  }));
}

function collectCities(geoJSONPaintings) {
  const citiesPaintings = geoJSONPaintings.features.map((item) => item.properties.location);
  return citiesPaintings.filter((elem, index, self) => index === self.indexOf(elem));
}

async function getLocation(city) {
  if (city === '') {
    return {
      name: city,
      lat: 0,
      lng: 0,
    };
  }
  const response = await axios.get(encodeURI(`${config.geocodeUrl}?q=${city}&apiKey=${config.geocodeApiKey}`));
  const resultCity = response.data.items.find((resultItem) => resultItem.address.countryCode === 'DEU') || response.data.items[0];

  return {
    name: city,
    lat: resultCity.position.lat,
    lng: resultCity.position.lng,
  };
}

async function forwardGeoCode(cities, geoJSONPaintings) {
  const promises = [];
  cities.forEach((city) => {
    promises.push(getLocation(city));
  });

  // json(lat, lng) in locationsPaintings speichern
  const locationsPaintings = await Promise.all(promises);

  geoJSONPaintings.features.forEach((item) => {
    const geoLocation = locationsPaintings.find((location) => location.name === item.properties.location);
    item.geometry.coordinates.push(geoLocation.lng);
    item.geometry.coordinates.push(geoLocation.lat);
  });
  return geoJSONPaintings.features;
}

function saveGeoJSON(geoJSONPaintings) {
  const data = JSON.stringify(geoJSONPaintings, null, 2);
  fs.writeFileSync('data.geojson', data);
}

async function run() {
  const geoJSONPaintings = {
    type: 'FeatureCollection',
    features: await buildJSONStructure(),
  };

  const cities = collectCities(geoJSONPaintings);
  geoJSONPaintings.features = await forwardGeoCode(cities, geoJSONPaintings);
  saveGeoJSON(geoJSONPaintings);
}

run().then(() => {
  console.log('converter finished');
}).catch((err) => {
  console.error(err);
});
