
var app = {
	languageData: null
};

$(document).ready(function () {
	
	// Load navbar
	$('#divNavbar').load('templates/navbar.html');
	
	// Load sidebar
	$('#divSidebar').load('templates/sidebar.html', function( response, status, xhr ) { 
		$('#divSideBarMenuToggle').click(function (e) {
			e.preventDefault();
			$('#divSidebar').toggleClass('active');
		});
	});
	
	// Show disclaimer on site login
	$('#divModal1').load('templates/disclaimer.html', function( response, status, xhr ) { 
		$('#divDisclaimer').modal('show');
	});
	
	bindEvents();
	
	setTimeout(function () {
		initSearch();
	}, 300);
	
	initMap('divMap');
});

function bindEvents () {
	
	// Bootstrap modal centering
    $(document).on('show.bs.modal', '.modal', centerModal);
    $(window).on('resize', function () {
        $('.modal:visible').each(centerModal);
    });
}

function initSearch () {

	// Initialize jQuery autocomplete on top search box
	$('#txtTopSearch').autocomplete({
		source: function (request, response) {
		
			var search = $('#txtTopSearch').val();
			
			service.autocomplete(search, 10).then(function (results) {
				
				results = JSON.parse(results);
				
				response($.map(results, function (item) {
					return {
						value: item.Gid,
						label: item.Name
					}
				}));
			});
		},
		select: function (event, ui) {
			
			setTimeout(function () {
				$('#txtTopSearch').val(ui.item.label);
			}, 50);
			
			service.getAutocompleteItemGeojson(ui.item.value).then(function (results) {
			
				results = JSON.parse(results);
			
				var geojson = JSON.parse(results.GeoJSON);
				var geojsonBounds = L.geoJson(geojson).getBounds();
				map.fitBounds(geojsonBounds);
				
				setTimeout(function () {
					var mapZoom = map.getZoom();
					map.setZoom(mapZoom - 1);
				}, 100);
			});
        }
	});
}

function topSearch () {
	
	$('#txtTopSearch').autocomplete('search');
}

function refreshSidebar () {
	
	$('#divAreaStatsSubheading').text('Within 0.25 Miles of (' + userLocation.lng + ', ' + userLocation.lat + ')');
	
	$('#divSidebarWrapper .load-indicator').show();
	
	service.getAreaStatistics(userLocation.lat, userLocation.lng, userLocation.radiusMiles).then(function (results) {
		
		results = JSON.parse(results);
		
		// Property Count
		$('#aPropertyCount').text(formatNumber(results.PropertyCount));
		
		// Average Years Old
		$('#aAverageYearsOld').text(formatNumber(results.AverageYearsOld));

		// Average Year Acquired
		$('#aAverageYearAcquired').text(formatNumber(results.AverageYearAcquired));

		// Market Value
		$('#aMarketValue').text('$' + formatNumber(results.MarketValue));

		// Sqft
		$('#aSqft').text(formatNumber(results.Sqft));
		
		$('#divSidebarWrapper .load-indicator').fadeOut();
	});
}

function setLanguage (languageCode) {
	
	var languageURL = 'js/translations/' + languageCode + '.json';

	$('.language-menu .language-label .language-code').html(languageCode);
	
	$('.language-data').load(languageURL, function() {
		
		app.languageData = $('.language-data').html()
			.replace(/\\n/g, "\\n")
			.replace(/\\'/g, "\\'")
			.replace(/\\"/g, '\\"')
			.replace(/\\&/g, "\\&")
			.replace(/\\r/g, "\\r")
			.replace(/\\t/g, "\\t")
			.replace(/\\b/g, "\\b")
			.replace(/\\f/g, "\\f");
		app.languageData = $.parseJSON(app.languageData);
		
		$('[translate]').each(function () {
			var translation = app.languageData[$(this).attr('translate')] || $(this).attr('translate');
			if (isDefined(translation)) $(this).html(translation);
		});
		
		$('[translate-placeholder]').each(function () {
			var translation = app.languageData[$(this).attr('translate-placeholder')] || $(this).attr('translate-placeholder');
			if (isDefined(translation)) $(this).attr('placeholder', translation);
		});
	});
	
}
