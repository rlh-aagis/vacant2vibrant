
var authService = {
	//authUrl: 'http://localhost/php/v2v-auth.php', // DEV
	authUrl: 'http://aagis.net/v2v/php/v2v-auth.php', // PROD
	activateUser: null,
	createUser: null,
	getUserDetails: null,
	loginUser: null,
	logoutUser: null
};

authService.createUser = function (registrationData) {
	
	if (! registrationData) return;
	
	// Format post data
	registrationData['Action'] = 'CreateUser';

	var deferred = $.ajax({
		url: authService.authUrl,
		type: 'POST',
		data: registrationData,
		success: function (results) { },
		error: function (e) {
			console.log(e.message);
		}
	});
	
	return deferred;
};

authService.activateUser = function (activationData) {
	
	if (! activationData) return;
	
	// Format post data
	activationData['Action'] = 'ActivateUser';

	var deferred = $.ajax({
		url: authService.authUrl,
		type: 'POST',
		data: activationData,
		success: function (results) { },
		error: function (e) {
			console.log(e.message);
		}
	});
	
	return deferred;
};

authService.loginUser = function (loginData) {
	
	if (! loginData) return;
	
	// Format post data
	loginData['Action'] = 'LoginUser';

	var deferred = $.ajax({
		url: authService.authUrl,
		type: 'POST',
		data: loginData,
		success: function (results) { },
		error: function (e) {
			console.log(e.message);
		}
	});
	
	return deferred;
};

authService.logoutUser = function () {

	// Format post data
	var logoutData = { Action : 'LogoutUser' };

	var deferred = $.ajax({
		url: authService.authUrl,
		type: 'POST',
		data: logoutData,
		success: function (results) { },
		error: function (e) {
			console.log(e.message);
		}
	});
	
	return deferred;
};

authService.getUserDetails = function () {
	
	var deferred = $.ajax({
		url: authService.authUrl + '?Action=GetUserDetails',
		type: 'GET',
		success: function (results) { },
		error: function (e) {
			console.log(e.message);
		}
	});
	
	return deferred;
};

authService.getUserFavorites = function () {
	
	var deferred = $.ajax({
		url: authService.authUrl + '?Action=GetUserFavorites',
		type: 'GET',
		success: function (results) { },
		error: function (e) {
			console.log(e.message);
		}
	});
	
	return deferred;
};

authService.setUserFavorite = function (searchText) {
	
	if (! searchText) return;
	
	// Format post data
	favoriteData = {
		Action: 'SetUserFavorite',
		SearchText: searchText
	};

	var deferred = $.ajax({
		url: authService.authUrl,
		type: 'POST',
		data: favoriteData,
		success: function (results) { },
		error: function (e) {
			console.log(e.message);
		}
	});
	
	return deferred;
};
