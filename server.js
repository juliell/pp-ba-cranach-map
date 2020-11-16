const express = require('express');

const server = express();

server.use(express.static(__dirname));

const port = 3000;

server.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

server.get('/data', (req, res) => {
  res.sendFile(`${__dirname}/data.geojson`);
});

server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
