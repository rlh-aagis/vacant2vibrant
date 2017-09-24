
var service = {
	apiKey: 'D77C71BCE446924A2F7E1D21C44C7',
	apiUrl: 'http://localhost/php/v2v-api.php',
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

service.getAreaStatistics = function (lat, lng, radius) {

	var url = service.apiUrl + '?action=GetAreaStatistics';
	if (isDefined(lat)) url += '&Lat=' + lat;
	if (isDefined(lng)) url += '&Lng=' + lng;
	if (isDefined(radius)) url += '&Radius=' + radius;
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

service.autocomplete = function (search, maxResults) {

	var url = service.apiUrl + '?action=Autocomplete';
	if (isDefined(search)) url += '&Search=' + search;
	if (isDefined(maxResults)) url += '&MaxResults=' + maxResults;
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

service.getAutocompleteItemGeojson = function (gid) {

	var url = service.apiUrl + '?action=GetAutocompleteItemGeojson';
	if (isDefined(gid)) url += '&Gid=' + gid;
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

