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
      $('.btn-reset-search').attr('style', 'display: inline !important');
    } else $('.btn-reset-search').attr('style', 'display: none !important');
    if (e.which === 13) {
      search();
    }
  });

  $('.btn-click-search').click(() => {
    search();
  });

  $('.btn-reset-search').click(() => {
    $('.btn-reset-search').attr('style', 'display: none !important');
    $('#searchInput').val('');
    if ($('.result-container').attr('style') === 'display: block !important') resetFilter();
  });

  $('.btn-reset-year').click(() => {
    $('.btn-reset-year').attr('style', 'display: none !important');
    $('#input-year-start').val('');
    $('#input-year-end').val('');
    if ($('.result-container').attr('style') === 'display: block !important') resetFilter();
  });

  $('#input-year-start').on('keyup', (e) => {
    dateListener(e, $('#input-year-start'));
  });

  $('#input-year-end').on('keyup', (e) => {
    dateListener(e, $('#input-year-end'));
  });

  $('.btn-filter-year').click(() => {
    const year0 = $('#input-year-start').val() || 0;
    const year1 = $('#input-year-end').val() || 9999;
    const startYear = parseInt(year0);
    const endYear= parseInt(year1);
    if (endYear >= startYear) {
      filterYear(startYear, endYear);
    } else {
      renderError('Das Startjahr muss vor dem Endjahr liegen.');
    }
    
  });

  $('#toggle-result-visibility').click(() => {
    if ($('.overlaybox').is(':visible')) {
      $('#toggle-result-visibility').attr('style', 'left: 8px; display: block;');
      $('.bi-chevron-left').hide();
      $('.bi-chevron-right').show();
      $('.overlaybox').hide();
      $('.result-container').hide();
    } else {
      $('#toggle-result-visibility').attr('style', 'left: 400px; display: block;');
      $('.bi-chevron-left').show();
      $('.bi-chevron-right').hide();
      $('.overlaybox').show();
      $('.result-container').attr('style', 'display: block !important;');
    }
  });
});
