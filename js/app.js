
var app = {
	autocompleteItems: [],
	languageCode: 'eng',
	languageData: null,
	loggedIn: false,
	page: 'landing',
	refreshSidebar: null
};

$(document).ready(function () {

	bindEvents();
	
	bindLandingModals();
	
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

function bindLandingModals () {
	
	if (app.page != 'landing') return;
	
	$('<div id="divMessageModalContainer"></div>').load('templates/message-modal.html', function (response, status, xhr) { 
	
	}).appendTo('body > .container');
	$('<div id="divDisclaimerContainer"></div>').load('templates/disclaimer.html', function (response, status, xhr) { 
	
	}).appendTo('body > .container');
}

function bindMapModals () {
	
	if (app.page == 'landing') return;
	
	$('<div id="divUserLoginModalContainer"></div>').load('templates/user-login.html', function (response, status, xhr) { 
		$('#divUserLoginModalContainer #txtLoginPassword').keyup(function (e) {
			e.preventDefault();
			if (e.keyCode == 13) $('#btnLogin').trigger('click');
		});
	}).appendTo('body > .container');
	$('<div id="divUserProfileModalContainer"></div>').load('templates/user-profile.html', function (response, status, xhr) { 
	
	}).appendTo('body > .container');
	$('<div id="divUserRegModalContainer"></div>').load('templates/user-registration.html', function (response, status, xhr) { 
	
	}).appendTo('body > .container');
	$('<div id="divUserActivationModalContainer"></div>').load('templates/user-activation.html', function (response, status, xhr) { 
	
	}).appendTo('body > .container');
	$('<div id="divUserDetailsModalContainer"></div>').load('templates/user-details.html', function (response, status, xhr) { 
	
	}).appendTo('body > .container');
}

function initSearch (searchElementId) {

	var _search = function (autocompleteItem) {
		
		if (app.page == 'landing') {
			landingSearch(autocompleteItem);
		} else {
			search(autocompleteItem);
		}
	};
	
	// Initialize jQuery autocomplete on top search box
	$('#' + searchElementId).autocomplete({
		source: function (request, response) {
			
			var search = $('#' + searchElementId).val();
			
			service.autocomplete(search, 10).then(function (results) {
				
				results = app.autocompleteItems = JSON.parse(results);
				
				response($.map(results, function (item) {
					return {
						value: item.Gid,
						label: item.Name,
						category: item.Category
					}
				}));
				
				$('#btnLandingSearch').toggleClass('disabled', (results.length == 0));
			});
		},
		select: function (event, ui) {
			
			// To prevent displaying value id
			setTimeout(function () {
				$('#' + searchElementId).val(ui.item.label);
			}, 25);
			
			_search(ui.item);
        }
	});
	
	$('#' + searchElementId).keyup(function (e) {
		
		e.preventDefault();
		
		// On enter key, search
		if (e.keyCode == 13) _search();
	});
}

function landingSearch (autocompleteItem) {
	
	if (($('#txtLandingSearch').val().trim().length != 0) 
		&& ((! isDefined(app.autocompleteItems)) || (app.autocompleteItems.length == 0))) {
		
		$('#divMessageModal').addClass('error-modal');
		$('#divMessageModal .modal-title').html('Search Not Found');
		$('#divMessageModal .modal-body').html('Search query not found; please check spelling or go to map view.');
		$('#divMessageModal').modal('show');
	} else {
		
		$('#divDisclaimerModal').data('AutocompleteItem', autocompleteItem)
		$('#divDisclaimerModal').modal('show');
	}
}

function performLandingSearch(autocompleteItem) {
	
	app.page = 'map';
	
	$('#divLandingPage').fadeOut();
	
	// Load navbar
	$('#divNavbar').load('templates/navbar.html').fadeIn();
	
	// Load sidebar
	$('#divSidebar').load('templates/sidebar.html', function( response, status, xhr ) { 
		$('#divSideBarMenuToggle').click(function (e) {
			e.preventDefault();
			
			$('#divSidebar').toggleClass('active');
			
			$('#divSideBarMenuToggle .sub_icon').removeClass('glyphicon-chevron-left glyphicon-chevron-right');
			
			if ($('#divSidebar').hasClass('active')) {
				$('#divSideBarMenuToggle .sub_icon').addClass('glyphicon-chevron-left');
			} else {
				$('#divSideBarMenuToggle .sub_icon').addClass('glyphicon-chevron-right');
			}
		});
	}).fadeIn();
	
	setTimeout(function () {
		initSearch('txtTopSearch');
	}, 300);
	
	setTimeout(function () {
		bindMapModals();
	}, 250);
	
	$('#divMap').fadeIn();
	
	initMap('divMap');
	
	search(autocompleteItem);
}

function search (autocompleteItem) {
	
	if ((! isDefined(autocompleteItem)) && (app.autocompleteItems.length > 0)) {
		autocompleteItem = {
			value: app.autocompleteItems[0].Gid,
			label: app.autocompleteItems[0].Name,
			category: app.autocompleteItems[0].Category
		};
	}
	
	var searchValue = null;
	if (isDefined(autocompleteItem)) {
		
		searchValue = autocompleteItem.value;
		userLocation.category = autocompleteItem.category;
		userLocation.label = autocompleteItem.label;
	} else {
		
		userLocation.category = 'city';
		userLocation.label = 'Kansas City';
	}
	
	searchMap(
		searchValue,
		userLocation.label,
		userLocation.category,
		null,
		null
	);

	app.autocompleteItems = [];
	
	setTimeout(function () {
		if (userLocation.category != 'city')
			$('#txtTopSearch').val(userLocation.label);
	}, 50);
}

function clearSearch () {
	$('#txtTopSearch').val('');
	clearMap();
}

app.refreshSidebar = function (locationLabel, locationCategory) {
	
	if (! isDefined(locationLabel)) 
		locationLabel = userLocation.label || 'address';
	if (! isDefined(locationCategory)) 
		locationCategory = userLocation.category || 'address';
	
	var areaStatsHeaderHTML = '';
	switch (locationCategory) {
		case 'address':
			areaStatsHeaderHTML = ((app.loggedIn) ? 'Within 0.25 Miles of ' : 'Neighborhood of ') + userLocation.label;
			break;
		case 'nbrhd':
			areaStatsHeaderHTML = locationLabel + ' Neighborhood';
			break;
		case 'zip':
			areaStatsHeaderHTML = 'Zip ' + locationLabel;
			break;
		case 'city':
			areaStatsHeaderHTML = locationLabel;
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
				// Average Year Sold
				$('#txtAverageYearSold').text(results.AverageYearSold).closest('.sidebar-item').fadeIn();
				// Average Year Acquired
				$('#txtAverageYearAcquired').text(results.AverageYearAcquired).closest('.sidebar-item').fadeIn();
				// Market Value
				if (isDefined(results.MarketValue))
					$('#txtMarketValue').text('$' + formatNumber(results.MarketValue)).closest('.sidebar-item').fadeIn();
				// Sqft
				if (isDefined(results.MarketValue))
					$('#txtSqft').text(formatNumber(results.Sqft)).closest('.sidebar-item').fadeIn();
				
				$('#divSidebarWrapper .load-indicator').fadeOut();
			});
			break;
		case 'nbrhd':
			service.getAreaStatisticsByNeighborhood(locationLabel).then(function (results) {
				results = JSON.parse(results);
				
				// Share of parcels owned by absentee owner number
				$('#txtAbsenteeOwnerShares').text(formatNumber(results.AbsenteeOwnerShares) + '%').closest('.sidebar-item').fadeIn();
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
		case 'city':
		
			// Property Count
			$('#txtPropertyCount').text(formatNumber(mapLayers.markers.length)).closest('.sidebar-item').fadeIn();
		
			$('#divSidebarWrapper .load-indicator').fadeOut();
			break;
	}
};

function toggleLanguage () {
	
	if (app.languageCode == 'eng') {
		app.languageCode = 'spa';
	} else {
		app.languageCode = 'eng';
	}
	
	var languageURL = 'js/translations/' + app.languageCode + '.json';

	$('.language-menu .language-label .language-code').html(app.languageCode);
	
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

function registerUser () {

	var createUserViewModel = {
		CreateUsername: $('#txtCreateUsername').val(),
		CreatePassword: $('#txtCreatePassword').val(),
		CreateRepeatPassword: $('#txtCreateConfirmPassword').val(),
		CreateEmailAddress: $('#txtCreateEmailAddress').val(),
		CreatePurchasedBefore: $('[name="CreatePurchasedBefore"]').val(),
		CreateGender: $('#txtCreateGender').val(),
		CreateAge: $('#txtCreateAge').val(),
		CreateZip: $('#txtCreateZip').val()
	};
	
	// Clear fields
	$('#txtCreateUsername').val('');
	$('#txtCreatePassword').val('');
	$('#txtCreateConfirmPassword').val('');
	$('#txtCreateEmailAddress').val('');
	$('[name="CreatePurchasedBefore"]').val('no');
	$('#txtCreateGender').val('');
	$('#txtCreateAge').val('');
	$('#txtCreateZip').val('');
	$('#btnRegisterUser').attr('disabled', 'disabled');
	
	authService.createUser(createUserViewModel).then(function (results) {
		// Success
	});
	
	$('#divUserRegistrationModal').modal('hide');
	
	setTimeout(function () {
		$('#divUserActivationModal').modal('show');
		$('#btnRegisterUser').removeAttr('disabled');
	}, 300);
}

function activateUser () {
	
	var activateUserViewModel = {
		ActivationKey: $('#txtActivationKey').val()
	};
	
	// Clear fields
	$('#txtActivationKey').val('');

	authService.activateUser(activateUserViewModel).then(function (results) {
		// Success
	});
	
	$('#divUserActivationModal').modal('hide');
	$('#divUserRegistrationModal').modal('hide');
}

function loginUser () {
	
	var loginUserViewModel = {
		LoginEmailAddress: $('#txtLoginEmailAddress').val(),
		LoginPassword: $('#txtLoginPassword').val()
	};
	
	// Clear fields
	$('#txtLoginEmailAddress').val('');
	$('#txtLoginPassword').val('');
	
	authService.loginUser(loginUserViewModel).then(function (results) {
		// Success
		$('#divUserLoginModal').modal('hide');
		$('.menu-register-user, .menu-login-user').hide();
		$('.menu-user .menu-username').html(loginUserViewModel.LoginEmailAddress);
		$('.menu-user').addClass('visible');
		
		$('.sidebar-register-or-login').hide();
		
		app.loggedIn = true;
		
		refreshUserFavorites();
		app.refreshSidebar();
		
	}, function (error) {
		
		$('#divUserLoginModal .error-message').html(error.responseText || 'Error authenticating user and password');
		$('#divUserLoginModal .error-row').fadeIn();
	});
}

function logoutUser () {
	
	authService.logoutUser().then(function (results) { 

		$('.menu-register-user, .menu-login-user').show();
		$('.menu-user').removeClass('visible');
		
		app.loggedIn = false;
		
		refreshUserFavorites();
		app.refreshSidebar();
		
		$('.sidebar-register-or-login').show();
	});
}

function openUserDetails () {
	
	authService.getUserDetails().then(function (results) {

		if (! isDefined(results)) return;
		
		results = JSON.parse(results);
	
		var userActiveStatus = (results.IsActive == '1') ? 'Active' : 'Inactive';
		var userPurchasedBefore = (results.PurchasedBefore == '1') ? 'Yes' : 'No';
	
		$('#divUserDetailsModal #txtUserEmailAddress').val(results.Email);
		$('#divUserDetailsModal #txtUserActiveStatus').val(userActiveStatus);
		$('#divUserDetailsModal #txtPurchasedBefore').val(userPurchasedBefore);
		$('#divUserDetailsModal #txtUserGender').val(results.Gender);
		$('#divUserDetailsModal #txtUserAge').val(results.Age);
		$('#divUserDetailsModal #txtUserZip').val(results.Zip);
	
		$('#divUserDetailsModal').modal('show');
	});
}

function toggleMapLegend () {
	
	$('.map-legend').toggleClass('visible');
}

function favoriteSearch (favoriteElement) {
	
	var favoriteItem = $(favoriteElement).data('favorite-data');
	
	if (! isDefined(favoriteItem)) return;
	
	map.closePopup();
	
	$('#txtTopSearch').val(favoriteItem.SearchText);
	$('#txtTopSearch').autocomplete('search');
	setTimeout(function () {
		$('.ui-autocomplete .ui-menu-item').hide();
	}, 300);
	setTimeout(function () {
		$('.top-search-button').trigger('click');
	}, 500);
}

function refreshUserFavorites () {
	
	$('.favorite-search-button').toggleClass('visible', app.loggedIn);
	$('.favorites-list').toggleClass('visible', app.loggedIn);
	$('.favorites-list .nav-menu-list-content').empty();
	
	if (! app.loggedIn) return;
		
	authService.getUserFavorites().then(function (results) {
		
		if (!isDefined(results)) return;
		
		results = JSON.parse(results);
		
		for (var i = 0; i < results.length; i++) {
		
			var favoriteItem = $(
				'<div class="nav-menu-list-item favorite-item" onclick="favoriteSearch(this)">' +
					'<span> ' + results[i].SearchText + ' </span>' +
				'</div>');
			favoriteItem.data('favorite-data', results[i]);
		
			$('.favorites-list .nav-menu-list-content').append(favoriteItem);
			
			if (i == 5) break;
		}
	});
}

function setUserFavorite () {
	
	var searchText = $('#txtTopSearch').val().trim();
	if (searchText.length == 0) return;
	
	authService.setUserFavorite(searchText).then(function (results) {
		refreshUserFavorites();
	});
}
