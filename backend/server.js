const express = require('express');
const path = require('path');

const server = express();

server.use(express.static(path.join(`${__dirname}/../frontend`)));

const port = 3000;

server.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}/../frontend/index.html`));
});

server.get('/data', (req, res) => {
  res.sendFile(path.join(`${__dirname}/data.geojson`));
});

server.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
