
var authService = {
	//authUrl: 'http://localhost/php/v2v-auth.php', // DEV
	authUrl: 'http://aagis.net/v2v/php/v2v-auth.php', // PROD
	createUser: null
};

authService.createUser = function (userData) {
	
	if (! userData) return;
	
	// Format post data
	userData['Action'] = 'CreateUser';

	var deferred = $.ajax({
		url: authService.authUrl,
		type: 'POST',
		data: userData,
		success: function (results) {
			//console.log('Success w/ results: ', results);
		},
		error: function (e) {
			console.log(e.message);
		}
	});
	
	return deferred;
};
