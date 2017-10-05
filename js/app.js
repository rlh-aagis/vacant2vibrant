
var app = {
	languageData: null,
	page: 'landing',
	refreshSidebar: null
};

$(document).ready(function () {

	// Show disclaimer on site login
	// $('#divModal1').load('templates/disclaimer.html', function( response, status, xhr ) { 
		// $('#divDisclaimer').modal('show');
	// });
	
	bindEvents();
	
	$('#divLandingPage').load('templates/landing.html', function( response, status, xhr ) { 
		
		setTimeout(function () {
			initSearch('txtLandingSearch');
		}, 300);
	});
});

function bindEvents () {
	
	// Bootstrap modal centering
    $(document).on('show.bs.modal', '.modal', centerModal);
    $(window).on('resize', function () {
        $('.modal:visible').each(centerModal);
    });
}

function initSearch (searchElementId) {

	// Initialize jQuery autocomplete on top search box
	$('#' + searchElementId).autocomplete({
		source: function (request, response) {
			
			var search = $('#' + searchElementId).val();
			
			service.autocomplete(search, 10).then(function (results) {
				
				results = JSON.parse(results);
				
				response($.map(results, function (item) {
					return {
						value: item.Gid,
						label: item.Name,
						category: item.Category
					}
				}));
			});
		},
		select: function (event, ui) {
			
			if (app.page == 'landing') landingSearch();
			
			setTimeout(function () {
				$('#' + searchElementId).val(ui.item.label);
			}, 50);

			userLocation.category = ui.item.category;
			userLocation.label = ui.item.label;
			
			searchMap(
				ui.item.value,
				userLocation.label,
				userLocation.category,
				null,
				null
			);
        }
	});
}

function landingSearch () {
	
	app.page = 'map';
	
	$('#divLandingPage').fadeOut();
	
	// Load navbar
	$('#divNavbar').load('templates/navbar.html').fadeIn();
	
	// Load sidebar
	$('#divSidebar').load('templates/sidebar.html', function( response, status, xhr ) { 
		$('#divSideBarMenuToggle').click(function (e) {
			e.preventDefault();
			$('#divSidebar').toggleClass('active');
		});
	}).fadeIn();
	
	setTimeout(function () {
		initSearch('txtTopSearch');
	}, 300);
	
	$('#divMap').fadeIn();
	
	initMap('divMap');
}

function topSearch () {
	
	$('#txtTopSearch').autocomplete('search');
}

app.refreshSidebar = function (locationLabel, locationCategory) {
	
	if (! isDefined(locationLabel)) 
		locationLabel = userLocation.label || 'address';
	if (! isDefined(locationCategory)) 
		locationCategory = userLocation.category || 'address';
	
	var areaStatsHeaderHTML = '';
	switch (locationCategory) {
		case 'address':
			areaStatsHeaderHTML = 'Within 0.25 Miles of ' +
				'(' + userLocation.lng + ', ' + userLocation.lat + ')';
			break;
		case 'nbrhd':
			areaStatsHeaderHTML = locationLabel + ' Neighborhood';
			break;
		case 'zip':
			areaStatsHeaderHTML = 'Zip ' + locationLabel;
			break;
	}
	$('#divAreaStatsSubheading').html(areaStatsHeaderHTML);
	
	$('#divSidebarWrapper .sidebar-item').hide();
	
	$('#divSidebarWrapper .load-indicator').show();
	
	// Call area stats service method based on location category
	switch (locationCategory) {
		case 'address':
			service.getAreaStatisticsByLocation(
				userLocation.lat, 
				userLocation.lng, 
				userLocation.searchRadiusMiles).then(function (results) {
					
				results = JSON.parse(results);
				
				// Property Count
				$('#txtPropertyCount').text(formatNumber(results.PropertyCount)).closest('.sidebar-item').fadeIn();
				// Average Years Old
				$('#txtAverageYearsOld').text(formatNumber(results.AverageYearsOld)).closest('.sidebar-item').fadeIn();
				// Average Year Acquired
				$('#txtAverageYearAcquired').text(formatNumber(results.AverageYearAcquired)).closest('.sidebar-item').fadeIn();
				// Market Value
				$('#txtMarketValue').text('$' + formatNumber(results.MarketValue)).closest('.sidebar-item').fadeIn();
				// Sqft
				$('#txtSqft').text(formatNumber(results.Sqft)).closest('.sidebar-item').fadeIn();
				
				$('#divSidebarWrapper .load-indicator').fadeOut();
			});
			break;
		case 'nbrhd':
			service.getAreaStatisticsByNeighborhood(locationLabel).then(function (results) {
				results = JSON.parse(results);
				
				// Share of parcels owned by absentee owner number
				$('#txtAbsenteeOwnerShares').text(formatNumber(results.AbsenteeOwnerShares)).closest('.sidebar-item').fadeIn();
				// Number of 311 Calls Visible from Street
				$('#txtStreetVisible311Calls').text(formatNumber(results.StreetVisible311Calls)).closest('.sidebar-item').fadeIn();
				// Property Violations Visible from Street
				$('#txtStreetVisiblePropertyViolations').text(formatNumber(results.StreetVisiblePropertyViolations)).closest('.sidebar-item').fadeIn();
				// Crimes against persons Number
				$('#txtCrimesAgainstPersons').text(formatNumber(results.CrimesAgainstPersons)).closest('.sidebar-item').fadeIn();
				// Crimes against persons Number
				$('#txtCrimesAgainstProperty').text(formatNumber(results.CrimesAgainstProperty)).closest('.sidebar-item').fadeIn();
				// Single Family BP additions
				$('#txtSingleFamilyBPAdditions').text(formatNumber(results.SingleFamilyBPAdditions)).closest('.sidebar-item').fadeIn();

				$('#divSidebarWrapper .load-indicator').fadeOut();
			});
			break;
		case 'zip':
			service.getAreaStatisticsByZipCode(locationLabel).then(function (results) {
				results = JSON.parse(results);
				
				// Share of parcels owned by absentee owner number
				$('#txtAbsenteeOwnerShares').text(formatNumber(results.AbsenteeOwnerShares)).closest('.sidebar-item').fadeIn();
				// Number of 311 Calls Visible from Street
				$('#txtStreetVisible311Calls').text(formatNumber(results.StreetVisible311Calls)).closest('.sidebar-item').fadeIn();
				// Property Violations Visible from Street
				$('#txtStreetVisiblePropertyViolations').text(formatNumber(results.StreetVisiblePropertyViolations)).closest('.sidebar-item').fadeIn();
				// Crimes against persons Number
				$('#txtCrimesAgainstPersons').text(formatNumber(results.CrimesAgainstPersons)).closest('.sidebar-item').fadeIn();
				// Crimes against persons Number
				$('#txtCrimesAgainstProperty').text(formatNumber(results.CrimesAgainstProperty)).closest('.sidebar-item').fadeIn();
				// Single Family BP additions
				$('#txtSingleFamilyBPAdditions').text(formatNumber(results.SingleFamilyBPAdditions)).closest('.sidebar-item').fadeIn();

				$('#divSidebarWrapper .load-indicator').fadeOut();
			});
			break;
	}
};

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

