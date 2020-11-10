const env = require('dotenv').config();

module.exports = {
  paintingsUrl: 'https://raw.githubusercontent.com/lucascranach/importer/master/docs/20200911/cda-paintings-v2.de.json',
  geocodeUrl: 'https://geocode.search.hereapi.com/v1/geocode',
  geocodeApiKey: env.parsed.API_KEY,
};
