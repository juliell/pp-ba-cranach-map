/* eslint-disable no-undef */
let map;

function initMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoianVsaWVsbCIsImEiOiJja2d0cmJia2cwbW8wMnRtanE3Z3Z5aGxoIn0.lLrglrscfprCZCJO-ymRpg';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    center: [15, 35],
    minZoom: 1,
    maxZoom: 10,
  });
  // Add zoom and rotation controls to the map
  map.addControl(new mapboxgl.NavigationControl());
}

function addClusterLayer() {
  // Design for cluster
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'paintings',
    filter: ['has', 'point_count'],
    paint: {
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#6b88ff',
        75,
        '#2c20d5',
        500,
        '#041a76'],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        75,
        30,
        500,
        40,
      ],
    },
  });
}

function addUnclusteredLayer() {
  // Design for single cluster point
  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'paintings',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#849cff',
      'circle-radius': 10,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
    },
  });
}

function addClusterCount() {
  // Design for cluster text
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'paintings',
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-size': [
        'step',
        ['get', 'point_count'],
        12,
        75,
        16,
        500,
        20,
      ],
    },
    paint: {
      'text-color': '#ffffff',
    },
  });
}

async function addData() {
  const paintingsGeoJSON = await $.get('http://localhost:3000/data');

  // Filter the objects with no (correct) coordinates
  paintingsGeoJSON.features = paintingsGeoJSON.features.filter((e) => e.geometry.coordinates[0] !== 200);

  map.on('load', () => {
    console.log('map load');
    map.addSource('paintings', {
      type: 'geojson',
      data: paintingsGeoJSON,
      cluster: true,
      clusterRadius: 50,
    });

    addClusterLayer();
    addUnclusteredLayer();
    addClusterCount();
    console.log('layers added');
  });
}

function addPopup(e, features, clusterId, clusterSource) {
  const pointCount = features[0].properties.point_count;
  const coordinates = e.features[0].geometry.coordinates.slice();

  clusterSource.getClusterChildren(clusterId, (err, aFeatures) => {
    if (aFeatures.length === 1) {
      clusterSource.getClusterLeaves(clusterId, pointCount, 0, (error, leavesFeatures) => {
        let popupText = `<h1>${leavesFeatures[0].properties.location}</h1>`;
        leavesFeatures.forEach((item) => {
          popupText += `<p>${item.properties.titles}, ${item.properties.dated}<br> ${item.properties.repository}</p>`;
        });

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(popupText)
          .addTo(map);
      });
    }
  });
}

function clickClusters() {
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters'],
    });
    const clusterId = features[0].properties.cluster_id;
    const clusterSource = map.getSource('paintings');

    map.getSource('paintings').getClusterExpansionZoom(
      clusterId,
      (err, zoom) => {
        if (err) return;
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: (zoom === 18 ? 5 : zoom),
        });
      },
    );
    addPopup(e, features, clusterId, clusterSource);
  });
}

function clickUnclusteredPoint() {
  map.on('click', 'unclustered-point', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const title = e.features[0].properties.titles;
    const { dated } = e.features[0].properties;
    const { repository } = e.features[0].properties;
    const { location } = e.features[0].properties;

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(`<h1>${location}</h1>
                <p>${title}, ${dated}
                <br>${repository}</p>`)
      .addTo(map);
  });
}

async function clusters() {
  await addData();
  clickClusters();
  clickUnclusteredPoint();

  map.on('mouseenter', 'clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = '';
  });
}

$(document).ready(async () => {
  initMap();
  await clusters();
});
