/* reason: map.js is used by script.js via $.getScript() */
/* eslint-disable no-unused-vars */
/* reason: mapbox is loaded via html script tag */
/* eslint-disable no-undef */
function initMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoianVsaWVsbCIsImEiOiJja2d0cmJia2cwbW8wMnRtanE3Z3Z5aGxoIn0.lLrglrscfprCZCJO-ymRpg';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-3, 32],
    minZoom: 1.7,
    maxZoom: 10,
  });
  // Add zoom and rotation controls to the map
  map.addControl(new mapboxgl.NavigationControl());

  const language = new MapboxLanguage();
  map.addControl(language);
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

function setMapBounds(filteredGeoJSON) {
  const latLngCoordinates = filteredGeoJSON.features.map((point) => point.geometry.coordinates);
  let mostWestPoint = [180, 0];
  let mostEastPoint = [-180, 0];
  let mostNorthPoint = [0, -90];
  let mostSouthPoint = [0, 90];

  latLngCoordinates.forEach((point) => {
    if (mostWestPoint[0] > point[0]) {
      mostWestPoint = point;
    }
    if (mostEastPoint[0] < point[0]) {
      mostEastPoint = point;
    }
    if (mostNorthPoint[1] < point[1]) {
      mostNorthPoint = point;
    }
    if (mostSouthPoint[1] > point[1]) {
      mostSouthPoint = point;
    }
  });

  lngLatBounds = new mapboxgl.LngLatBounds([mostWestPoint[0], mostSouthPoint[1]], [mostEastPoint[0], mostNorthPoint[1]]);

  map.fitBounds(lngLatBounds, {
    padding: {
      top: 200, bottom: 200, left: 600, right: 200,
    },
  });
}

function addMapData(filteredGeoJSON = null) {
  map.on('load', () => {
    map.addSource('paintings', {
      type: 'geojson',
      data: filteredGeoJSON || paintingsGeoJSON,
      cluster: true,
      clusterRadius: 50,
      // clusterMaxZoom: 6,
    });

    if (filteredGeoJSON) {
      setMapBounds(filteredGeoJSON);
    }
    addClusterLayer();
    addUnclusteredLayer();
    addClusterCount();
  });
}

async function loadData() {
  paintingsGeoJSON = await $.get('http://localhost:3000/data');

  // Filter the objects with no (correct) coordinates
  paintingsGeoJSON.features = paintingsGeoJSON.features.filter((e) => e.geometry.coordinates[0] !== 200);
  addMapData();
}

function addClusterPopups(e, features, clusterId, clusterSource) {
  const pointCount = features[0].properties.point_count;
  const coordinates = e.features[0].geometry.coordinates.slice();

  clusterSource.getClusterChildren(clusterId, (err, aFeatures) => {
    if (aFeatures.length === 1) {
      clusterSource.getClusterLeaves(clusterId, pointCount, 0, (error, leavesFeatures) => {
        let popupText = `<h5 Class="popupCity">${leavesFeatures[0].properties.location}</h5>`;
        leavesFeatures.forEach((item) => {
          popupText += renderCard(item, false);
        });

        new mapboxgl.Popup({
          anchor: 'bottom-left',
        })
          .setLngLat(coordinates)
          .setHTML(popupText)
          .addTo(map);
      });
    }
  });
}

function clusterClickListener() {
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters'],
    });
    const clusterId = features[0].properties.cluster_id;
    const clusterSource = map.getSource('paintings');
    map.getSource('paintings').getClusterExpansionZoom(
      clusterId,
      (err, zoom) => {
        map.flyTo({
          center: features[0].geometry.coordinates,
          zoom,
          speed: 0.6,
        });
      },
    );
    addClusterPopups(e, features, clusterId, clusterSource);
  });
}

function unclusteredPointClickListener() {
  map.on('click', 'unclustered-point', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();

    currentZoomLevel = map.getZoom();
    map.flyTo({
      center: e.features[0].geometry.coordinates,
      zoom: (currentZoomLevel < 5 ? 5 : currentZoomLevel),
      speed: 0.6,
    });
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(`<h5 class="popupCity">${e.features[0].properties.location}</h5>${renderCard(e.features[0], false)}`)
      .addTo(map);
  });
}

function addClusterListener() {
  clusterClickListener();
  unclusteredPointClickListener();

  map.on('mouseenter', 'clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseenter', 'unclustered-point', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = '';
  });

  map.on('mouseleave', 'unclustered-point', () => {
    map.getCanvas().style.cursor = '';
  });
}
