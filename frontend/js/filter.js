function renderCard(searchResult, s) {
    const paintingURL = searchResult.properties.image !== '' ? searchResult.properties.image : 'No-image-available.png';
    const paintingTitle = searchResult.properties.titles.length > 41 ? `${searchResult.properties.titles.substring(0, 40)}...` : searchResult.properties.titles;
    const paintingCoordinates = JSON.stringify(searchResult.geometry.coordinates);
    if (s === 1) {
        return `
        <div class="card mb-3 searchResult-renderCard">
            <div class="row g-0 m-0" id="row-searchResult">
                <div class="col-md-5 p-0" id="col-5-searchResult">
                    <img class="img-center-block" src="${paintingURL}" alt="kein Bild verfügbar">
                </div>
                <div class="col-md-7 p-0 col-7-searchResult">
                    <div class="card-body body-searchResult p-2">
                        <h5 class="card-title searchResult" data-toggle="tooltip" data-placement="top"
                        title="${searchResult.properties.titles}">${paintingTitle}</h5>
                        <p class="card-text searchResult">
                        ${searchResult.properties.dated}<br>
                        ${searchResult.properties.repository}<br>
                        ${searchResult.properties.location}, ${searchResult.properties.country}</p>
                        <div class="row">
                            <div class="col-md-2">
                                <button class="btn p-0" type="button">
                                    <a target="_blank" href="http://www.lucascranach.org/${searchResult.properties.inventoryNumber}">  
                                    <i class="bi bi-info-circle-fill infoIcon"></i></a>
                                </button>
                            </div>
                            <div class="col-md-2 col-popupCard-paintingsMarker">
                                <button class="btn p-0 paintingMarker" type="button" data-location="${paintingCoordinates}">
                                    <i class="bi bi-geo-alt-fill markerIcon"></i></a>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    } return `
        <div class="card popupCard">
            <div class="row g-0 m-0 row-popupCard">
                <div class="col-md-5 col-5-popupCard p-0">
                     <img class="img-center-block" src="${paintingURL}" alt="kein Bild verfügbar">
                </div>
                <div class="col-md-7 p-0 col-7-popupCard">
                    <div class="card-body p-0 body-popupCard">
                        <h5 class="card-title title-popupCard" data-toggle="tooltip" data-placement="top"
                            title="${searchResult.properties.titles}">${paintingTitle}</h5>
                            <p class="card-text text-popupCard">${searchResult.properties.dated}<br>
                            ${searchResult.properties.repository}<br>
                            ${searchResult.properties.location}, ${searchResult.properties.country}</p>
                            <div class="col-md-2 p-0">
                                <button class="btn p-0" type="button">
                                    <a target="_blank" href="http://www.lucascranach.org/${searchResult.properties.inventoryNumber}">  
                                    <i class="bi bi-info-circle-fill infoIcon"></i></a>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
}

function renderError(message) {
    $('.searchResults').html(`<div class="container mp-0" style="font-size: 14px"><p>${message}</p></div>`);
    $('#countResults').html(0);
    $('.resultContainer').attr('style', 'display: block !important');
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
        renderResults(filteredResult);
    } else {
        renderError('Der Suchbegriff muss aus mindestens 3 Zeichen bestehen.')
    }
}

function datedFilter(year0, year1) {
    const filteredResult = { ...paintingsGeoJSON };
    filteredResult.features = paintingsGeoJSON.features.filter((item) => {
        return year0 <= item.properties.dating[0] && year1 >= item.properties.dating[1];
    });

    const filteredResultSort = { ...filteredResult };
    filteredResultSort.features = filteredResult.features.sort((a, b) => a.properties.dating[0] - b.properties.dating[0]);
    console.log(filteredResultSort);
    renderResults(filteredResultSort);
}

function renderResults(filteredResult) {
    let resultListHTML = '';
    filteredResult.features.forEach((result) => {
        resultListHTML += renderCard(result, s = 1);
    });

    if (resultListHTML === '') {
        renderError(`Die Suche ergab kein Ergebnis.`);
    } else {
        $('.searchResults').html(resultListHTML);
        $('#countResults').html(filteredResult.features.length);
        $('.resultContainer').attr('style', 'display: block !important');
        $('#hideShowContent').show();
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
