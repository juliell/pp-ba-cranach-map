/* reason: jQuery is loaded via html script tag */
/* eslint-disable no-undef */
let map;
let paintingsGeoJSON;

$(document).ready(async () => {
  await $.getScript('js/filter.js');
  await $.getScript('js/map.js');
  initMap();
  await loadData();
  addClusterListener();

  $('#datedTab').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  $('#searchTab').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  $('#searchInput').on('keyup', (e) => {
    if ($('#searchInput').val().length > 0) {
      $('.btn-resetSearch').attr('style', 'display: inline !important');
    } else $('.btn-resetSearch').attr('style', 'display: none !important');
    if (e.which === 13) {
      search();
    }
  });

  $('.btn-clickSearch').click(() => {
    search();
  });

  $('.btn-resetSearch').click(() => {
    $('.btn-resetSearch').attr('style', 'display: none !important');
    $('#searchInput').val('');
    resetFilter();
  });

  $('.btn-resetDated').click(() => {
    $('.btn-resetDated').attr('style', 'display: none !important');
    $('#year0Input').val('');
    $('#year1Input').val('');
    resetFilter();
  });

  $('#year0Input').on('keyup', (e) => {
    dateListener(e, $('#year0Input'));
  });

  $('#year1Input').on('keyup', (e) => {
    dateListener(e, $('#year1Input'));
  });

  $('.btn-searchDated').click(() => {
    const year0 = $('#year0Input').val() || 0;
    const year1 = $('#year1Input').val() || 9999;
    if (year1 > year0) {
      filterYear(year0, year1);
    } else {
      renderError('Das Startjahr muss vor dem Endjahr liegen.');
    }
  });

  $('#hideShowContent').click(() => {
    if ($('.overlaybox').is(':visible')) {
      $('#hideShowContent').attr('style', 'left: 8px; display: block;');
      $('.leftArrow').hide();
      $('.rightArrow').show();
      $('.overlaybox').hide();
      $('.resultContainer').hide();
    } else {
      $('#hideShowContent').attr('style', 'left: 400px; display: block;');
      $('.leftArrow').show();
      $('.rightArrow').hide();
      $('.overlaybox').show();
      $('.resultContainer').attr('style', 'display: block !important;');
    }
  });
});
