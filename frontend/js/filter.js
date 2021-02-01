function renderCard(searchResult, s) {
    const paintingURL = searchResult.properties.image !== '' ? searchResult.properties.image : 'No-image-available.png';
    const paintingTitle = searchResult.properties.titles.length > 41 ? `${searchResult.properties.titles.substring(0, 40)}...` : searchResult.properties.titles;
    const paintingCoordinates = JSON.stringify(searchResult.geometry.coordinates);
    if (s === 1) {
        return `
        <div class="card mb-3" style="width: 100%; height: 200px; margin-bottom: 8px !important;">
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
    } return `
        <div class="card popupCard">
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
