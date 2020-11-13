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
  // Add zoom and rotation controls to the map.
  map.addControl(new mapboxgl.NavigationControl());
}

async function cluster() {
  const paintingsGeoJson = await $.get('http://localhost:3000/data');

  // rausfilter der Objekte mit keinen (korrekten) Koordinaten
  paintingsGeoJson.features = paintingsGeoJson.features.filter((e) => e.geometry.coordinates[0] !== 0);

  map.on('load', () => {
    console.log('Map load');
    map.addSource('paintings', {
      type: 'geojson',
      data: paintingsGeoJson,
      cluster: true,
      clusterRadius: 50,
    });

    // Design für Cluster
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

    // Design für Cluster-Text
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

    // Design für einzelnen Clusterpunkt
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
    console.log('layers added');
  });

  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters'],
    });
    const clusterId = features[0].properties.cluster_id;
    const clusterSource = map.getSource('paintings');
    const pointCount = features[0].properties.point_count;
    const coordinates = e.features[0].geometry.coordinates.slice();

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

    clusterSource.getClusterChildren(clusterId, (err, aFeatures) => {
      console.log(aFeatures.length);

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
  });

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

  map.on('mouseenter', 'clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = '';
  });
}

$(document).ready(async () => {
  initMap();
  await cluster();
  // await getLocations();
});
