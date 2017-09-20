
var service = {
	apiKey: 'D77C71BCE446924A2F7E1D21C44C7',
	apiUrl: 'http://aagis.net/v2v/php/v2v-api.php',
	getMapProperties: null,
	getPropertyDetail: null
};

service.getMapProperties = function (propertyId) {

	var url = service.apiUrl + '?action=GetMapProperties';
	url += '&key=' + service.apiKey;

	var deferred = $.ajax({
		url: url,
		type: 'GET',
		beforeSend: function (xhr) { },
		success: function (data, textStatus, xhr) { },
		complete: function (xhr, textStatus) { },
		error: function (xhr, textStatus, errorThrown) { }
	});
	
	return deferred;
};

service.getPropertyDetails = function (propertyId) {

	var url = service.apiUrl + '?action=GetPropertyDetails';
	if (isDefined(propertyId)) url += '&PropertyId=' + propertyId;
	url += '&key=' + service.apiKey;

	var deferred = $.ajax({
		url: url,
		type: 'GET',
		beforeSend: function (xhr) { },
		success: function (data, textStatus, xhr) { },
		complete: function (xhr, textStatus) { },
		error: function (xhr, textStatus, errorThrown) { }
	});
	
	return deferred;
};
