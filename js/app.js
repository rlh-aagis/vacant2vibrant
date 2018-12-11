
var app = {
	autocompleteItems: [],
	loginEmailAddress: null,
	languageCode: 'eng',
	languageData: [],
	loggedIn: false,
	page: 'landing',
	refreshSidebar: null
};

$(document).ready(function () {

	bindEvents();
	
	bindLandingModals();
	
	loadLandingPage();
	
	checkLoginStatus();
});

function checkLoginStatus () {
	
	if (! Storage) return;
	
	var v2vLoginInfo = localStorage.getItem('V2VLoginInfo');
	try {
		v2vLoginInfo = JSON.parse(v2vLoginInfo);
	} catch (ex) { }
	
	if (v2vLoginInfo && v2vLoginInfo.LoggedIn && v2vLoginInfo.EmailAddress) { 
	
		app.loggedIn = true;
		app.loginEmailAddress = v2vLoginInfo.EmailAddress;

	} else {
		
		logoutUser();
	}
}

function loadLandingPage () {
	
	// Load navbar
	$('#divNavbar').load('templates/navbar.html').fadeIn();
	
	// Load landing page
	$('#divLandingPage').load('templates/landing.html', function( response, status, xhr ) { 
		
		setTimeout(function () {
			initSearch('txtLandingSearch');
			
			if (app.loggedIn) {
				$('.menu-user .menu-username').html(app.loginEmailAddress);
				$('.menu-user').addClass('visible');
				$('.sidebar-register-or-login').hide();
				$('.menu-register-user, .menu-login-user').hide();

				refreshUserFavorites();
			}
			
		}, 300);
	});
}

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
		$('.disclaimer-more-button').bind('click', function () {
			$(this).hide();
			$('.disclaimer-collapsed .fadeout').remove();
			$('.disclaimer-collapsed').removeClass('disclaimer-collapsed');
		});
	}).appendTo('body > .container');
	
	$('<div id="divUserLoginModalContainer"></div>').load('templates/user/user-login.html', function (response, status, xhr) { 
		$('#divUserLoginModalContainer #txtLoginPassword').keyup(function (e) {
			e.preventDefault();
			if (e.keyCode == 13) $('#btnLogin').trigger('click');
		});
	}).appendTo('body > .container');
	
	// $('<div id="divUserProfileModalContainer"></div>').load('templates/user/user-profile.html', function (response, status, xhr) { 
	
	// }).appendTo('body > .container');
	$('<div id="divUserRegModalContainer"></div>').load('templates/user/user-registration.html', function (response, status, xhr) { 
	
	}).appendTo('body > .container');
	$('<div id="divUserActivationModalContainer"></div>').load('templates/user/user-activation.html', function (response, status, xhr) { 
	
	}).appendTo('body > .container');
	$('<div id="divUserForgotPasswordRequestModalContainer"></div>').load('templates/user/user-forgot-password-request.html', function (response, status, xhr) { 
	
	}).appendTo('body > .container');
	$('<div id="divUserForgotPasswordConfirmModalContainer"></div>').load('templates/user/user-forgot-password-confirm.html', function (response, status, xhr) { 
	
	}).appendTo('body > .container');
	$('<div id="divUserDetailsModalContainer"></div>').load('templates/user/user-details.html', function (response, status, xhr) { 
	
	}).appendTo('body > .container');
}

function bindMapModals () {
	
	if (app.page == 'landing') return;
	
	// Nothing here yet
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
					var label = (item.Name + ' (' + ((item.Category == 'nbrhd') ? 'Neighborhood' : 
						((item.Category == 'zip') ? 'Zip Code' : 'Address'))  + ')');
					return {
						category: item.Category,
						label: label,
						name: item.Name,
						value: item.Gid
					}
				}));
				
				$('#btnLandingSearch').toggleClass('disabled', (results.length == 0));
			});
		},
		select: function (event, ui) {
			
			// To prevent displaying value id
			setTimeout(function () {
				$('#' + searchElementId).val(ui.item.name);
			}, 25);
			
			_search(ui.item);
        }
	});/*.data('ui-autocomplete')._renderItem = function( ul, item ) {
        return $('<li></li>').data('item.autocomplete', item)
            .append(
				'<div style="display: inline-block;">' + item.name + '</div>' + 
				'<div style="display: inline-block;">(' + item.category + ')</div>')
            .appendTo(ul);
	};*/
	
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

		bindMapModals();

		app.refreshSidebar();
		
		$('#navbar').find('.search-menu, .home-menu').removeClass('display-none');
		
		if ($(window).width() <= 600)
			$('.map-legend').removeClass('map-legend-expanded');
		
	}, 300);
	
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
	
	authService.saveSearch(userLocation.label).then(function (results) { });
	
	if (isDefined(userLocation.label)) 
		userLocation.label = userLocation.label.replace(/\(neighborhood\)|\(zip\scode\)|\(address\)/gi, '').trim();
	
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
	
	var adjustedLocationCategory = ((locationCategory == 'address') 
		&& (mapInfo.radiusType == 'neighborhood')) ? 'nbrhd' : locationCategory;
		
	var areaStatsHeaderHTML = '';
	switch (adjustedLocationCategory) {
		case 'address':
			areaStatsHeaderHTML = (mapInfo.radiusType == 'quarter-mile') ? ('<span style="margin-right: 4px;" translate="within 0.25 miles of"> Within 0.25 Miles of </span>' + userLocation.label) : 
				('<span translate="neighborhood of"> Neighborhood of </span>&nbsp;<span>' + userLocation.neighborhood + '</span>');
			break;
		case 'nbrhd':
			areaStatsHeaderHTML = '<span translate="neighborhood of"> Neighborhood of </span>&nbsp;<span>' + (userLocation.neighborhood || locationLabel) + '</span>';
			break;
		case 'zip':
			areaStatsHeaderHTML = 'Zip ' + locationLabel;
			break;
		case 'city':
			areaStatsHeaderHTML = locationLabel;
			break;
	}
	$('#divAreaStatsSubheading').html(areaStatsHeaderHTML);
	translate('#divAreaStatsSubheading');
	
	$('#divSidebarWrapper .sidebar-item').hide();
	
	$('#divSidebarWrapper .load-indicator').show();
	
	// Call area stats service method based on location category
	switch (locationCategory) {
		case 'address':
			service.getAreaStatisticsByLocation(
				userLocation.lat, 
				userLocation.lng, 
				userLocation.searchRadiusMiles,
				mapInfo.radiusType).then(function (results) {
				
				try {
					results = JSON.parse(results);
				} catch (ex) { }
				if (! isDefined(results)) return;
				
				// Property Count
				$('#txtPropertyCountSold').text(formatNumber(results.SoldPropertyCount)).closest('.sidebar-item').fadeIn();
				$('#txtPropertyCountUnsold').text(formatNumber(results.UnsoldPropertyCount)).closest('.sidebar-item').fadeIn();
				// Market Value
				if (isDefined(results.MarketValue))
					$('#txtMarketValue').text('$' + formatNumber(results.MarketValue)).closest('.sidebar-item').fadeIn();
				// Sqft
				if (isDefined(results.MarketValue))
					$('#txtSqft').text(formatNumber(results.Sqft)).closest('.sidebar-item').fadeIn();
				
				refreshQuintiles(results);
			});
			break;
		case 'nbrhd':
			service.getAreaStatisticsByNeighborhood(locationLabel).then(function (results) {
				
				results = JSON.parse(results);
				
				// Property Count
				$('#txtPropertyCountSold').text(formatNumber(results.SoldPropertyCount)).closest('.sidebar-item').fadeIn();
				$('#txtPropertyCountUnsold').text(formatNumber(results.UnsoldPropertyCount)).closest('.sidebar-item').fadeIn();
				// Market Value
				if (isDefined(results.MarketValue))
					$('#txtMarketValue').text('$' + formatNumber(results.MarketValue)).closest('.sidebar-item').fadeIn();
				// Sqft
				if (isDefined(results.MarketValue))
					$('#txtSqft').text(formatNumber(results.Sqft)).closest('.sidebar-item').fadeIn();
				
				refreshQuintiles(results);
			});
			break;
		case 'zip':
			service.getAreaStatisticsByZipCode(locationLabel).then(function (results) {
				
				results = JSON.parse(results);
				
				// Property Count
				$('#txtPropertyCountSold').text(formatNumber(results.SoldPropertyCount)).closest('.sidebar-item').fadeIn();
				$('#txtPropertyCountUnsold').text(formatNumber(results.UnsoldPropertyCount)).closest('.sidebar-item').fadeIn();
				// Market Value
				if (isDefined(results.MarketValue))
					$('#txtMarketValue').text('$' + formatNumber(results.MarketValue)).closest('.sidebar-item').fadeIn();
				// Sqft
				if (isDefined(results.MarketValue))
					$('#txtSqft').text(formatNumber(results.Sqft)).closest('.sidebar-item').fadeIn();
				
				refreshQuintiles(results);
			});
			break;
		case 'city':
		
			// Property Count
			$('#txtPropertyCountSold').text('696').closest('.sidebar-item').fadeIn();
			$('#txtPropertyCountUnsold').text('629').closest('.sidebar-item').fadeIn();
		
			$('#divSidebarWrapper .load-indicator').fadeOut();
			break;
	}
};

function refreshQuintiles (results) {
	
	//var cityQuintileAverages = [2.97, 3.03, 3.01, 3.02, 3.01, 3.00, 3.03];
	var cityQuintileAverages = [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5];
	
	// Average Assessed Value
	var assessedValue = (results.AverageAssessedValue == 0) ? 'n/a' : formatNumber(results.AverageAssessedValue);
	$('#txtAverageAssessedValue').text(assessedValue).closest('.sidebar-item').fadeIn();
	$('#divAverageAssessedValue').css({
		'background-color': getQuintileValue(0, results.AverageAssessedValueQnt), 
		'width' : (((results.AverageAssessedValueQnt / 5) * 100) + '%') 
	});
	$('#divAverageAssessedValue').empty().append('<div class="q1-box"></div><div class="q2-box">' +
		'</div><div class="q3-box"></div><div class="q4-box"></div><div class="q5-box"></div>');
	$('#divAverageAssessedValue').append('<div class="q-city-average"' + 
		' title="City Average: ' + cityQuintileAverages[1].toFixed(2) + '"' + 
		' style="left: ' + (cityQuintileAverages[1] / 5 * 100) + '%;"></div>');
	
	// Single Family BP additions
	$('#txtSingleFamilyBPAdditions').text(formatNumber(results.SingleFamilyBPAdditions)).closest('.sidebar-item').fadeIn();
	$('#divSingleFamilyBPAdditionsValue').css({
		'background-color': getQuintileValue(1, results.SingleFamilyBPAdditionsQnt), 
		'width' : (((results.SingleFamilyBPAdditionsQnt / 5) * 100) + '%') 
	});
	$('#divSingleFamilyBPAdditionsValue').empty().append('<div class="q1-box"></div><div class="q2-box">' +
		'</div><div class="q3-box"></div><div class="q4-box"></div><div class="q5-box"></div>');
	$('#divSingleFamilyBPAdditionsValue').append('<div class="q-city-average"' + 
		' title="City Average: ' + cityQuintileAverages[6].toFixed(2) + '"' + 
		' style="left: ' + (cityQuintileAverages[6] / 5 * 100) + '%;"></div>');
	
	// Share of parcels owned by absentee owner number
	$('#txtAbsenteeOwnerShares').text(formatNumber(results.AbsenteeOwnerShares)).closest('.sidebar-item').fadeIn();
	$('#divAbsenteeOwnerSharesValue').css({
		'background-color': getQuintileValue(2, results.AbsenteeOwnerSharesQnt, true), 
		'width' : (((results.AbsenteeOwnerSharesQnt / 5) * 100) + '%') 
	});
	$('#divAbsenteeOwnerSharesValue').empty().append('<div class="q1-box"></div><div class="q2-box">' +
		'</div><div class="q3-box"></div><div class="q4-box"></div><div class="q5-box"></div>');
	$('#divAbsenteeOwnerSharesValue').append('<div class="q-city-average"' + 
		' title="City Average: ' + cityQuintileAverages[0].toFixed(2) + '"' + 
		' style="left: ' + (cityQuintileAverages[0] / 5 * 100) + '%;"></div>');
	
	// Number of 311 Calls Visible from Street
	$('#txtStreetVisible311Calls').text(formatNumber(results.StreetVisible311Calls)).closest('.sidebar-item').fadeIn();
	$('#divStreetVisible311CallsValue').css({
		'background-color': getQuintileValue(3, results.StreetVisible311CallsQnt, true), 
		'width' : (((results.StreetVisible311CallsQnt / 5) * 100) + '%') 
	});
	$('#divStreetVisible311CallsValue').empty().append('<div class="q1-box"></div><div class="q2-box">' +
		'</div><div class="q3-box"></div><div class="q4-box"></div><div class="q5-box"></div>');
	$('#divStreetVisible311CallsValue').append('<div class="q-city-average"' +
		' title="City Average: ' + cityQuintileAverages[2].toFixed(2) + '"' + 
		' style="left: ' + (cityQuintileAverages[2] / 5 * 100) + '%;"></div>');
	
	// Property Violations Visible from Street
	$('#txtStreetVisiblePropertyViolations').text(formatNumber(results.StreetVisiblePropertyViolations)).closest('.sidebar-item').fadeIn();
	$('#divStreetVisiblePropertyViolationsValue').css({
		'background-color': getQuintileValue(4, results.StreetVisiblePropertyViolationsQnt, true), 
		'width' : (((results.StreetVisiblePropertyViolationsQnt / 5) * 100) + '%') 
	});
	$('#divStreetVisiblePropertyViolationsValue').empty().append('<div class="q1-box"></div><div class="q2-box">' +
		'</div><div class="q3-box"></div><div class="q4-box"></div><div class="q5-box"></div>');
	$('#divStreetVisiblePropertyViolationsValue').append('<div class="q-city-average"' + 
		' title="City Average: ' + cityQuintileAverages[3].toFixed(2) + '"' + 
		' style="left: ' + (cityQuintileAverages[3] / 5 * 100) + '%;"></div>');
	
	// Crimes Against Persons Number
	$('#txtCrimesAgainstPersons').text(formatNumber(results.CrimesAgainstPersons)).closest('.sidebar-item').fadeIn();
	$('#divCrimesAgainstPersonsValue').css({
		'background-color': getQuintileValue(5, results.CrimesAgainstPersonsQnt, true), 
		'width' : (((results.CrimesAgainstPersonsQnt / 5) * 100) + '%') 
	});
	$('#divCrimesAgainstPersonsValue').empty().append('<div class="q1-box"></div><div class="q2-box">' +
		'</div><div class="q3-box"></div><div class="q4-box"></div><div class="q5-box"></div>');
	$('#divCrimesAgainstPersonsValue').append('<div class="q-city-average"' + 
		' title="City Average: ' + cityQuintileAverages[4].toFixed(2) + '"' + 
		' style="left: ' + (cityQuintileAverages[4] / 5 * 100) + '%;"></div>');
	
	// Crimes Against Property Number
	$('#txtCrimesAgainstProperty').text(formatNumber(results.CrimesAgainstProperty)).closest('.sidebar-item').fadeIn();
	$('#divCrimesAgainstPropertyValue').css({
		'background-color': getQuintileValue(6, results.CrimesAgainstPropertyQnt, true), 
		'width' : (((results.CrimesAgainstPropertyQnt / 5) * 100) + '%') 
	});
	$('#divCrimesAgainstPropertyValue').empty().append('<div class="q1-box"></div><div class="q2-box">' +
		'</div><div class="q3-box"></div><div class="q4-box"></div><div class="q5-box"></div>');
	$('#divCrimesAgainstPropertyValue').append('<div class="q-city-average"' + 
		' title="City Average: ' + cityQuintileAverages[5].toFixed(2) + '"' + 
		' style="left: ' + (cityQuintileAverages[5] / 5 * 100) + '%;"></div>');
	
	$('#divSidebarWrapper .load-indicator').fadeOut();
	
	$('.sidebar-heading.with-quintile').toggle(($('.sidebar-item.with-quintile').length > 0));
	
	$('#liQuintileLegend').addClass('always-visible');
}

function getQuintileValue (index, value, isReverse) {
	
	var ret = '';
	
	if (index < 2) ret = 'rgba(45, 188, 37, 0.90)';
	if (index >= 2) ret = 'rgba(255, 155, 0, 0.80)';
	
	/*
	if (! isReverse) {
		if (value <= 1) {
			ret = '#EA0B0B';
		} else if (value <= 2) {
			ret = '#EA7107';
		} else if (value <= 3) {
			ret = '#FCD735';
		} else if (value <= 4) {
			ret = '#E4F407';
		} else if (value <= 5) {
			ret = '#41BC25';
		}
	} else {
		if (value <= 1) {
			ret = '#41BC25';
		} else if (value <= 2) {
			ret = '#E4F407';
		} else if (value <= 3) {
			ret = '#FCD735';
		} else if (value <= 4) {
			ret = '#EA7107';
		} else if (value <= 5) {
			ret = '#EA0B0B';
		}
	}
	*/
	
	return ret;
}

function toggleLanguage () {
	
	if (app.languageCode == 'eng') {
		app.languageCode = 'spa';
	} else {
		app.languageCode = 'eng';
	}
	
	var languageURL = 'translations/' + app.languageCode + '.json';

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
		
		translate();
	});
}

function translate (selector) {
	
	if (! selector) selector = 'body';

	$(selector + '[translate]').add($(selector).find('[translate]')).each(function () {
		var translation = app.languageData[$(this).attr('translate')];
		if (isDefined(translation)) $(this).html(translation);
	});
	
	$(selector + '[translate-placeholder]').add($(selector).find('[translate-placeholder]')).each(function () {
		var translation = app.languageData[$(this).attr('translate-placeholder')];
		if (isDefined(translation)) $(this).attr('placeholder', translation);
	});
}

function registerUser () {

	var createUserViewModel = {
		CreateUsername: $('#txtCreateUsername').val(),
		CreatePassword: $('#txtCreatePassword').val(),
		CreateRepeatPassword: $('#txtCreateConfirmPassword').val(),
		CreateEmailAddress: $('#txtCreateEmailAddress').val(),
		CreatePurchasedBefore: $('#selCreatePurchasedBefore').val(),
		CreateGender: $('#selCreateGender').val(),
		CreateAge: $('#txtCreateAge').val(),
		CreateZip: $('#txtCreateZip').val()
	};
	
	// Clear fields
	$('#txtCreateUsername').val('');
	$('#txtCreatePassword').val('');
	$('#txtCreateConfirmPassword').val('');
	$('#txtCreateEmailAddress').val('');
	$('[name="CreatePurchasedBefore"]').val('no');
	$('#selCreateGender').val('');
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

function requestResetPassword () {
	
	var requestResetPasswordViewModel = {
		ResetEmailAddress: $('#txtForgotPasswordEmailAddress').val(),
	};
	
	// Clear fields
	$('#txtForgotPasswordEmailAddress').val('');
	$('#btnRequestResetPassword').attr('disabled', 'disabled');
	
	authService.requestResetPassword(requestResetPasswordViewModel).then(function (results) {
		// Success
	});
	
	$('#divUserLoginModal').modal('hide');
	
	setTimeout(function () {
		$('#divUserForgotPasswordRequestModal').modal('hide');
		$('#divUserForgotPasswordConfirmModal').modal('show');
		$('#btnRequestResetPassword').removeAttr('disabled');
	}, 300);
}

function confirmResetPassword () {
	
	var confirmResetPasswordViewModel = {
		ResetKey: $('#txtResetKey').val(),
		ResetPassword: $('#txtResetPassword').val(),
		ResetPasswordConfirm: $('#txtResetConfirmPassword').val()
	};
	
	// Clear fields
	$('#txtResetKey').val('');
	$('#txtResetPassword').val('');
	$('#txtResetConfirmPassword').val('');
	$('#btnConfirmResetPassword').attr('disabled', 'disabled');
	
	authService.confirmResetPassword(confirmResetPasswordViewModel).then(function (results) {
		// Success
	});
	
	setTimeout(function () {
		$('#btnConfirmResetPassword').removeAttr('disabled');
		$('#divUserForgotPasswordConfirmModal').modal('hide');
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
		$('.navbar-nav.navbar-left').addClass('logged-in');
		
		$('.sidebar-register-or-login').hide();
		
		app.loggedIn = true;
		if (Storage) {
			localStorage.setItem('V2VLoginInfo', JSON.stringify({
				EmailAddress: loginUserViewModel.LoginEmailAddress,
				LoggedIn: app.loggedIn
			}));
		}
		
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
		$('.navbar-nav.navbar-left').removeClass('logged-in');
		
		app.loggedIn = false;
		if (Storage) {
			localStorage.setItem('V2VLoginInfo', JSON.stringify({
				EmailAddress: null,
				LoggedIn: app.loggedIn
			}));
		}
		
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

function favoriteSearch (favoriteElement) {
	
	var favoriteItem = $(favoriteElement).data('favorite-data');
	
	if (! isDefined(favoriteItem)) return;
	
	if (app.page == 'landing') {
		
		$('#txtLandingSearch').val(favoriteItem.SearchText);
		$('#txtLandingSearch').autocomplete('search');
		
		setTimeout(function () {
			$('.ui-autocomplete .ui-menu-item').hide();
		}, 300);
		setTimeout(function () {
			$('#btnLandingSearch').trigger('click');
		}, 500);
	} else {

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
}

function clearFavorite (favoriteElement) {
	
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
					'<span>' + results[i].SearchText + '</span>' +
					'<span class="delete-button" onclick="removeUserFavorite(event, ' + results[i].Id + ')">' +
						'<i class="glyphicon glyphicon-trash" />' +
					'</span>' +
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

function removeUserFavorite (event, favoriteId) {
	
	event.preventDefault();
	event.stopPropagation();
	
	authService.deleteUserFavorite(favoriteId).then(function (results) {
		refreshUserFavorites();
	});
}

