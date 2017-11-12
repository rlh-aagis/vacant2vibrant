
var authService = {
	//authUrl: 'http://localhost/php/v2v-auth.php', // DEV
	authUrl: 'http://aagis.net/v2v/php/v2v-auth.php', // PROD
	activateUser: null,
	createUser: null,
	confirmResetPassword: null,
	requestResetPassword: null,
	getUserDetails: null,
	loginUser: null,
	logoutUser: null,
	getUserFavorites: null,
	setUserFavorite: null,
	saveSearch: null
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

authService.requestResetPassword = function (requestResetData) {
	
	if (! requestResetData) return;
	
	// Format post data
	requestResetData['Action'] = 'RequestResetPassword';

	var deferred = $.ajax({
		url: authService.authUrl,
		type: 'POST',
		data: requestResetData,
		success: function (results) { },
		error: function (e) {
			console.log(e.message);
		}
	});
	
	return deferred;
};

authService.confirmResetPassword = function (confirmResetData) {
	
	if (! confirmResetData) return;
	
	// Format post data
	confirmResetData['Action'] = 'ConfirmResetPassword';

	var deferred = $.ajax({
		url: authService.authUrl,
		type: 'POST',
		data: confirmResetData,
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

authService.saveSearch = function (searchText) {
	
	if (! searchText) return;
	
	// Format post data
	favoriteData = {
		Action: 'SaveSearch',
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

authService.deleteUserFavorite = function (favoriteId) {
	
	if (! favoriteId) return;
	
	// Format post data
	favoriteData = {
		Action: 'DeleteUserFavorite',
		FavoriteId: favoriteId
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

