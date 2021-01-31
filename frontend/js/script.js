/* eslint-disable no-undef */
let map;
let paintingsGeoJSON;

$(document).ready(async () => {
  await $.getScript('js/filter.js');
  await $.getScript('js/map.js');
  initMap();
  await loadData();
  clusters();

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
