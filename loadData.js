/* eslint-disable no-undef */
let map;
let paintingsGeoJSON;

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

  // // eslint-disable-next-line new-cap
  lngLatBounds = new mapboxgl.LngLatBounds([mostWestPoint[0], mostSouthPoint[1]], [mostEastPoint[0], mostNorthPoint[1]]);

  map.fitBounds(lngLatBounds, {
    padding: {
      top: 60, bottom: 60, left: 500, right: 60,
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

    if (filteredGeoJSON) {
      setMapBounds(filteredGeoJSON);
    }
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
  console.log(typeof searchResult.properties.dating);
  const paintingURL = searchResult.properties.image !== '' ? searchResult.properties.image : 'No-image-available.png';
  const paintingTitle = searchResult.properties.titles.length > 41 ? `${searchResult.properties.titles.substring(0, 40)}...` : searchResult.properties.titles;
  const paintingCoordinates = JSON.stringify(searchResult.geometry.coordinates);
  if (s === 1) {
    return `<div class="card mb-3" style="width: 100%; height: 200px; margin-bottom: 8px !important;">
  <div class="row g-0 m-0" style="height: inherit">
    <div class="col-md-5 img p-0" style="height: inherit;">
      <img class="center-block" src="${paintingURL}" alt="kein Bild verfügbar">
    </div>
    <div class="col-md-7 p-0" style="height: inherit">
      <div class="card-body p-2" style="height: inherit">
        <h5 class="card-title search" style="font-size: 18px;"
        data-toggle="tooltip" data-placement="top" title="${searchResult.properties.titles}">${paintingTitle}</h5>
        <p class="card-text search" style="margin-bottom: 5px; font-size: 12px;">
        ${searchResult.properties.dated}<br>
        ${searchResult.properties.repository}<br>
        ${searchResult.properties.location}, ${searchResult.properties.country}</p>
        <div class="row">
          <div class="col-md-2">
          <button class="btn p-0" type="button">
            <a target="_blank" href="http://www.lucascranach.org/${searchResult.properties.inventoryNumber}">  
            <i class="bi bi-info-circle-fill paintingIcon"></i></a>
          </button>
            </div>
          <div class="col-md-2" style="padding-left: 5px;">
            <button class="btn p-0 paintingMarker" type="button" data-location="${paintingCoordinates}">
            <i class="bi bi-geo-alt-fill paintingIcon"></i></a>
            </button>
           </div>
        </div>
      </div>
    </div>
  </div>
</div>`;
  } return `<div class="card popupCard">
  <div class="row g-0 m-0" style="height: 150px; width: 280px; margin-bottom: 8px !important;">
    <div class="col-md-5 img p-0" style="height: 100%;">
      <img class="center-block" src="${paintingURL}" alt="kein Bild verfügbar">
    </div>
    <div class="col-md-7 p-0" style="height: 100%;">
      <div class="card-body p-0" style="margin-top: 5px">
        <h5 class="card-title popupTitle" data-toggle="tooltip" data-placement="top" title="${searchResult.properties.titles}">${paintingTitle}</h5>
        <p class="card-text popupText">${searchResult.properties.dated}<br>
        ${searchResult.properties.repository}<br>
        ${searchResult.properties.location}, ${searchResult.properties.country}</p>
        <div class="col-md-2 p-0">
          <button class="btn p-0" type="button">
            <a target="_blank" href="http://www.lucascranach.org/${searchResult.properties.inventoryNumber}">  
            <i class="bi bi-info-circle-fill paintingIcon"></i></a>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>`;
}

function search() {
  if ($('#searchInput').val().length > 2) {
    const searchString = searchInput.value.toLowerCase();
    const filteredResult = { ...paintingsGeoJSON };
    filteredResult.features = paintingsGeoJSON.features.filter((elem) => {
      return elem.properties.titles.toLowerCase().includes(searchString)
        || elem.properties.location.toLowerCase().includes(searchString)
        || elem.properties.repository.toLowerCase().includes(searchString);
    });
    let resultListHTML = '';
    filteredResult.features.forEach((result) => {
      resultListHTML += renderCard(result, s = 1);
    });

    if (resultListHTML === '') {
      $('.searchResults').html(`<div class="container mp-0">
      <p>Die Suche nach '${searchString}' ergab kein Ergebnis.</p></div>`);
      $('#countResults').html(filteredResult.features.length);
    } else {
      $('.searchResults').html(resultListHTML);
      $('#countResults').html(filteredResult.features.length);
      $('.resultContainer').attr('style', 'display: block !important');
      initMap();
      clusters();
      addData(filteredResult);


      $('.paintingMarker').click((e) => {
        markerLocation = JSON.parse(e.currentTarget.dataset.location);
        map.flyTo({
          center: markerLocation,
          zoom: 9,
          speed: 0.6,
        });
      });
    }
  }
}

function datedFilter(year0, year1) {
  const filteredResult = { ...paintingsGeoJSON };
  //filteredResult.features = paintingsGeoJSON.features.filter((elem) => elem.properties.dated.includes(year0 || year1));

  filteredResult.features = paintingsGeoJSON.features.filter((item) => {
    return year0 <= item.properties.dating[0] && year1 >= item.properties.dating[1];
  });

  let resultListHTML = '';
  filteredResult.features.forEach((result) => {
    resultListHTML += renderCard(result, s = 1);
  });

  if (resultListHTML === '') {
    $('.searchResults').html(`<div class="container mp-0">
      <p>Die Suche nach '${searchString}' ergab kein Ergebnis.</p></div>`);
    $('#countResults').html(filteredResult.features.length);
  } else {
    $('.searchResults').html(resultListHTML);
    $('#countResults').html(filteredResult.features.length);
    $('.resultContainer').attr('style', 'display: block !important');
    initMap();
    clusters();
    addData(filteredResult);

    $('.paintingMarker').click((e) => {
      markerLocation = JSON.parse(e.currentTarget.dataset.location);
      map.flyTo({
        center: markerLocation,
        zoom: 9,
        speed: 0.6,
      });
    });
  }
}

function addPopupCluster(e, features, clusterId, clusterSource) {
  const pointCount = features[0].properties.point_count;
  const coordinates = e.features[0].geometry.coordinates.slice();

  clusterSource.getClusterChildren(clusterId, (err, aFeatures) => {
    if (aFeatures.length === 1) {
      clusterSource.getClusterLeaves(clusterId, pointCount, 0, (error, leavesFeatures) => {
        let popupText = `<h5 Class="popupCity">${leavesFeatures[0].properties.location}</h5>`;
        leavesFeatures.forEach((item) => {
          popupText += renderCard(item, s = 0);
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
        map.flyTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
          speed: 0.6,
        });
      },
      // (err, zoom) => {
      //   if (err) return;
      //   map.easeTo({
      //     center: features[0].geometry.coordinates,
      //     zoom: (zoom === 18 ? 6 : zoom),
      //   });
      // },
    );
    addPopupCluster(e, features, clusterId, clusterSource);
  });
}

function clickUnclusteredPoint() {
  map.on('click', 'unclustered-point', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();

    currentZoomLevel = map.getZoom();
    console.log(currentZoomLevel);
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
      .setHTML(`<h5 class="popupCity">${e.features[0].properties.location}</h5>${renderCard(e.features[0])}`)
      .addTo(map);
  });
}

function clusters() {
  clickClusters();
  clickUnclusteredPoint();

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

$(document).ready(async () => {
  initMap();
  await loadData();
  clusters();
  search();

  $('#searchInput').on('keyup', (e) => {
    if ($('#searchInput').val().length > 0) {
      $('#resetSearch').attr('style', 'display: inline !important');
    } else $('#resetSearch').attr('style', 'display: none !important');
    if (e.which === 13) {
      search();
    }
  });

  $('#resetSearch').click(() => {
    $('#resetSearch').attr('style', 'display: none !important');
    $('#searchInput').val('');
    $('.searchResults').html('');
    $('.resultContainer').attr('style', 'display: none !important');
    $('#countResults').html('');
    initMap();
    clusters();
    addData();
  });

  $('.searchbarButton').click(() => {
    search();
  });

  $('.yearSearchButton').click(() => {
    const year0 = $('#year0Input').val();
    const year1 = $('#year1Input').val();
    console.log(year0, year1);
    if (year1 > year0) {
      datedFilter(year0, year1);
    }
  });

  // $('.hideSearchResults').click(() => {
  //   $('.showSearchResults').show();
  //   $('.hidesearchResults').hide();
  // });

  // $('.showSearchResults').click(() => {
  //   $('.showSearchResults').hide();
  //   $('.hidesearchResults').show();
  // });
});
