/* eslint-disable no-undef */
let map;
let paintingsGeoJSON;

$(document).ready(async () => {
  await $.getScript('js/filter.js');
  await $.getScript('js/map.js');
  initMap();
  await loadData();
  clusters();

  $('#datedTab').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  })

  $('#searchTab').click(function (e) {
    e.preventDefault()
    $(this).tab('show')
  })

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
    $('.searchResults').html('');
    $('.resultContainer').attr('style', 'display: none !important');
    $('#countResults').html('');
    $('#hideShowContent').hide();
    initMap();
    clusters();
    addData();
  });

  $('.btn-resetDated').click(() => {
    $('.btn-resetDated').attr('style', 'display: none !important');
    $('#year0Input').val('');
    $('#year1Input').val('');
    $('.searchResults').html('');
    $('.resultContainer').attr('style', 'display: none !important');
    $('#countResults').html('');
    $('#hideShowContent').hide();
    initMap();
    clusters();
    addData();
  });

  $('#year0Input').on('keyup', (e) => {
    if ($('#year0Input').val().length > 0) {
      $('.btn-resetDated').attr('style', 'display: inline !important');
    } else $('.btn-resetDated').attr('style', 'display: none !important');
    if (e.which === 13) {
      const year0 = $('#year0Input').val() || 0;
      const year1 = $('#year1Input').val() || 9999;
      if (year1 > year0) {
        datedFilter(year0, year1);
      } else {
        renderError('Das Startjahr muss vor dem Endjahr liegen.');
      }
    }
  });

  $('#year0Input').on('keyup', (e) => {
    if (e.which === 13) {
      const year0 = $('#year0Input').val() || 0;
      const year1 = $('#year1Input').val() || 9999;
      if (year1 >= year0) {
        datedFilter(year0, year1);
      } else {
        renderError('Das Startjahr muss vor dem Endjahr liegen.');
      }
    }
  });

  $('#year1Input').on('keyup', (e) => {
    if (e.which === 13) {
      const year0 = $('#year0Input').val() || 0;
      const year1 = $('#year1Input').val() || 9999;
      if (year1 >= year0) {
        datedFilter(year0, year1);
      } else {
        renderError('Das Startjahr muss vor dem Endjahr liegen.');
      }
    }
  });

  $('.btn-searchDated').click(() => {
    const year0 = $('#year0Input').val() || 0;
    const year1 = $('#year1Input').val() || 9999;
    if (year1 > year0) {
      datedFilter(year0, year1);
    } else {
      renderError('Das Startjahr muss vor dem Endjahr liegen.');
    }
  });

  $('#hideShowContent').click(() => {
    if ($('.overlaybox').is(":visible")) {
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
  })

});
