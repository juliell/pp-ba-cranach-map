/* eslint-disable no-undef */
let map;
let paintingsGeoJSON;

function initMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoianVsaWVsbCIsImEiOiJja2d0cmJia2cwbW8wMnRtanE3Z3Z5aGxoIn0.lLrglrscfprCZCJO-ymRpg';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [3, 42],
    minZoom: 1.2,
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

function addData(filteredGeoJSON = null) {
  map.on('load', () => {
    console.log('map load');
    map.addSource('paintings', {
      type: 'geojson',
      data: filteredGeoJSON || paintingsGeoJSON,
      cluster: true,
      clusterRadius: 50,
      // clusterMaxZoom: 6,
    });

    addClusterLayer();
    addUnclusteredLayer();
    addClusterCount();
    console.log('layers added');
  });
}

async function loadData() {
  paintingsGeoJSON = await $.get('http://localhost:3000/data');

  // Filter the objects with no (correct) coordinates
  paintingsGeoJSON.features = paintingsGeoJSON.features.filter((e) => e.geometry.coordinates[0] !== 200);

  addData();
}

function renderCard(searchResult, s) {
  const imageURL = searchResult.image !== '' ? searchResult.image : 'No-image-available.png';
  if (s === 1) {
    return `<div class="card mb-3" style="max-width: 540px; max-height: 300px">
  <div class="row g-0">
    <div class="col-md-4 img">
      <img src="${imageURL}" alt="kein Bild verfügbar">
    </div>
    <div class="col-md-8">
      <div class="card-body">
        <h5 class="card-title">${searchResult.titles}</h5>
        <p class="card-text">${searchResult.dated}<br>${searchResult.repository}<br>${searchResult.location}, ${searchResult.country}</p>
        <p class="card-text"><small class="text-muted">
        <a target="_blank" href="http://www.lucascranach.org/${searchResult.inventoryNumber}">mehr Infos</a></small></p>
      </div>
    </div>
  </div>
</div>`;
  } return `<div class="card mb-3" style="max-width: 540px; max-height: 250px;">
  <div class="row g-0">
    <div class="col-md-4">
      <img src="${imageURL}" alt="kein Bild verfügbar">
    </div>
    <div class="col-md-8">
      <div class="card-body" style="padding-left: 30px;">
        <h6 class="card-title mp-3">${searchResult.titles}</h6>
        <p class="card-text mp-3">${searchResult.dated}<br>${searchResult.repository}<br>${searchResult.location}, ${searchResult.country}</p>
        <p class="card-text mp-3"><small class="text-muted">
        <a target="_blank" href="http://www.lucascranach.org/${searchResult.inventoryNumber}">mehr Infos</a></small></p>
      </div>
    </div>
  </div>
</div>`;
}

function search() {
  $('#searchInput').on('keyup', (e) => {
    if (e.which === 13 && searchInput.value.length > 3) {
      const searchString = searchInput.value.toLowerCase();
      const filteredResult = { ...paintingsGeoJSON };
      filteredResult.features = paintingsGeoJSON.features.filter((elem) => elem.properties.titles.toLowerCase().includes(searchString));

      let resultListHTML = '';
      filteredResult.features.forEach((result) => {
        resultListHTML += renderCard(result.properties, s = 1);
      });
      $('#searchResults').html(resultListHTML);
      initMap();
      clusters();
      addData(filteredResult);
    }
  });
}

function addPopupCluster(e, features, clusterId, clusterSource) {
  const pointCount = features[0].properties.point_count;
  const coordinates = e.features[0].geometry.coordinates.slice();

  clusterSource.getClusterChildren(clusterId, (err, aFeatures) => {
    if (aFeatures.length === 1) {
      clusterSource.getClusterLeaves(clusterId, pointCount, 0, (error, leavesFeatures) => {
        let popupText = `<h5>${leavesFeatures[0].properties.location}</h5>`;
        leavesFeatures.forEach((item) => {
          popupText += renderCard(item.properties, s = 0);
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
          zoom: (zoom === 18 ? 6 : zoom),
        });
      },
    );
    addPopupCluster(e, features, clusterId, clusterSource);
  });
}

function clickUnclusteredPoint() {
  map.on('click', 'unclustered-point', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    // console.log(e.features[0].properties);
    // const clusterId = e.features[0].properties.cluster_id;
    // map.getSource('paintings').getClusterExpansionZoom(
    //   clusterId,
    //   (err, zoom) => {
    //     if (err) return;
    //     map.easeTo({
    //       center: features[0].geometry.coordinates,
    //       zoom: (zoom === 18 ? 6 : zoom),
    //     });
    //   },
    // );

    // Ensure that if the map is zoomed out such that
    // multiple copies of the feature are visible, the
    // popup appears over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(`<h5>${e.features[0].properties.location}</h5>${renderCard(e.features[0].properties)}`)
      .addTo(map);
  });
}

function clusters() {
  clickClusters();
  clickUnclusteredPoint();

  // const popup = new mapboxgl.Popup({
  //   className: 'popups',
  //   closeButton: false,
  //   closeOnClick: false,
  // });

  map.on('mouseenter', 'clusters', (e) => {
    map.getCanvas().style.cursor = 'pointer';

    // hover Popup
    // const coordinates = e.features[0].geometry.coordinates.slice();
    // const { location } = e.features[0].properties;
    // console.log({location});
    // var locations = e.features[0].properties.description;
    // popup.setLngLat(coordinates).setHTML('Test').addTo(map);
  });
  map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = '';
    // popup.remove();
  });
}

$(document).ready(async () => {
  initMap();
  await loadData();
  clusters();
  search();
});
