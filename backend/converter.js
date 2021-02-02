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
  // adoption of the relevant properties
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
      dating: [item.dating.begin, item.dating.end],
      location: item.locations[0].term,
      country: item.locations[0].path.split(' > ')[0],
      repository: item.repository,
      owner: item.owner,
      inventoryNumber: item.inventoryNumber,
      image: item.images ? item.images.representative.variants[0].s.src : '',
    },
  }));
}

function collectCities(geoJSONPaintings) {
  const paintingLocations = geoJSONPaintings.features.map((item) => `${item.properties.location},${item.properties.country}`);
  return paintingLocations.filter((elem, index, self) => index === self.indexOf(elem));
}

async function getLocation(city) {
  if (city === ',') {
    return {
      name: '',
      lat: 200,
      lng: 200,
    };
  }
  const response = await axios.get(encodeURI(`${config.geocodeUrl}?q=${city}&apiKey=${config.geocodeApiKey}`));
  const resultCity = response.data.items[0];
  return {
    name: city.split(',')[0],
    lat: resultCity.position.lat,
    lng: resultCity.position.lng,
  };
}

async function forwardGeoCode(cities, geoJSONPaintings) {
  const promises = [];
  cities.forEach((city) => {
    promises.push(getLocation(city));
  });

  // save json(lat, lng) in locationsPaintings
  const locationsPaintings = await Promise.all(promises);

  geoJSONPaintings.features.forEach((item) => {
    const geoLocation = locationsPaintings.find((location) => location.name === item.properties.location);
    if (geoLocation) {
      item.geometry.coordinates.push(geoLocation.lng);
      item.geometry.coordinates.push(geoLocation.lat);
    } else {
      item.geometry.coordinates.push(200);
      item.geometry.coordinates.push(200);
    }
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
