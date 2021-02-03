/* reason: filter.js is used by script.js via $.getScript() */
/* eslint-disable no-unused-vars */
/* reason: jQuery is loaded via html script tag */
/* eslint-disable no-undef */
function renderCard(searchResult, isFilter) {
  const paintingURL = searchResult.properties.image !== '' ? searchResult.properties.image : 'No-image-available.png';
  const paintingTitle = searchResult.properties.titles;
  const paintingTitleShort = paintingTitle.length > 41 ? `${paintingTitle.substring(0, 40)}...` : paintingTitle;
  const paintingCoordinates = JSON.stringify(searchResult.geometry.coordinates);
  if (isFilter) {
    return `
        <div class="card mb-3 search-result-card">
            <div class="row g-0 m-0" id="rowSearchResult">
                <div class="col-md-5 p-0" id="imageColumnSearchResult">
                    <img class="img-center-block" src="${paintingURL}" alt="kein Bild verfügbar">
                </div>
                <div class="col-md-7 p-0 content-column-search-result">
                    <div class="card-body body-search-result p-2">
                        <h5 class="card-title search-result-title" data-toggle="tooltip" data-placement="top"
                        title="${paintingTitle}">${paintingTitleShort}</h5>
                        <p class="card-text search-result-text">
                        ${searchResult.properties.dated}<br>
                        ${searchResult.properties.repository}<br>
                        ${searchResult.properties.location}, ${searchResult.properties.country}</p>
                        <div class="row">
                            <div class="col-md-2">
                                <button class="btn p-0" type="button">
                                    <a target="_blank" href="http://www.lucascranach.org/${searchResult.properties.inventoryNumber}">  
                                    <i class="bi bi-info-circle-fill"></i></a>
                                </button>
                            </div>
                            <div class="col-md-2 btn-geo-icon-column">
                                <button class="btn p-0 btn-geo-icon" type="button" data-location="${paintingCoordinates}">
                                    <i class="bi bi-geo-alt-fill"></i></a>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
  } return `
        <div class="card popup-card">
            <div class="row g-0 m-0 row-popup-card">
                <div class="col-md-5 img-column-popup-card p-0">
                     <img class="img-center-block" src="${paintingURL}" alt="kein Bild verfügbar">
                </div>
                <div class="col-md-7 p-0 content-column-popup-card">
                    <div class="card-body p-0 body-popup-card">
                        <h5 class="card-title title-popup-card" data-toggle="tooltip" data-placement="top"
                            title="${paintingTitle}">${paintingTitleShort}</h5>
                            <p class="card-text text-popup-card">${searchResult.properties.dated}<br>
                            ${searchResult.properties.repository}<br>
                            ${searchResult.properties.location}, ${searchResult.properties.country}</p>
                            <div class="col-md-2 p-0">
                                <button class="btn p-0" type="button">
                                    <a target="_blank" href="http://www.lucascranach.org/${searchResult.properties.inventoryNumber}">  
                                    <i class="bi bi-info-circle-fill bi-info-circle-fill"></i></a>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
}

function renderError(message) {
  $('.search-result').html(`<div class="container mp-0 error-message"><p>${message}</p></div>`);
  $('#resultCount').html(0);
  $('.result-container').attr('style', 'display: block !important');
}

function search() {
  if ($('#searchInput').val().length > 2) {
    const searchString = searchInput.value.toLowerCase();
    const filteredResult = { ...paintingsGeoJSON };
    filteredResult.features = paintingsGeoJSON.features.filter((elem) => elem.properties.titles.toLowerCase().includes(searchString)
        || elem.properties.location.toLowerCase().includes(searchString));
    renderResults(filteredResult);
  } else {
    renderError('Der Suchbegriff muss aus mindestens 3 Zeichen bestehen.');
  }
}

function filterYear(startYear, endYear) {
  const filteredResult = { ...paintingsGeoJSON };
  filteredResult.features = paintingsGeoJSON.features.filter((item) => startYear <= item.properties.dating[0] && endYear >= item.properties.dating[1]);
  const filteredResultSort = { ...filteredResult };
  filteredResultSort.features = filteredResult.features.sort((a, b) => a.properties.dating[0] - b.properties.dating[0]);
  renderResults(filteredResultSort);
}

function renderResults(filteredResult) {
  let resultListHTML = '';
  filteredResult.features.forEach((result) => {
    resultListHTML += renderCard(result, true);
  });

  if (resultListHTML === '') {
    renderError('Die Suche ergab kein Ergebnis.');
  } else {
    $('.search-result').html(resultListHTML);
    $('#resultCount').html(filteredResult.features.length);
    $('.result-container').attr('style', 'display: block !important');
    $('#toggle-result-visibility').show();
    initMap();
    addClusterListener();
    addMapData(filteredResult);

    $('.btn-geo-icon').click((e) => {
      markerLocation = JSON.parse(e.currentTarget.dataset.location);
      map.flyTo({
        center: markerLocation,
        zoom: 9,
        speed: 0.6,
      });
    });
  }
}

function dateListener(e, inputField) {
  if (inputField.val().length > 0) {
    $('.btn-reset-year').attr('style', 'display: inline !important');
  } else $('.btn-reset-year').attr('style', 'display: none !important');
  if (e.which === 13) {
    const year0 = $('#input-year-start').val() || 0;
    const year1 = $('#input-year-end').val() || 9999;
    const startYear = parseInt(year0);
    const endYear= parseInt(year1);
    if (endYear >= startYear) {
      filterYear(startYear, endYear);
    } else {
      renderError('Das Startjahr muss vor dem Endjahr liegen.');
    }
  }
}

function resetFilter() {
  $('.search-result').html('');
  $('.result-container').attr('style', 'display: none !important');
  $('#resultCount').html('');
  $('#toggle-result-visibility').hide();
  initMap();
  addClusterListener();
  addMapData();
}
