
var markerIcons = {
	blueHouseIcon: null,
	grayHouseIcon: null,
	greenHouseIcon: null,
	greenHouseSoldIcon: null,
	orangeHouseIcon: null,
	orangeHouseSoldIcon: null,
	redHouseIcon: null,
	redHouseSoldIcon: null
};

var mapLayers = {
	markers: [],
	searchRadiusLayer: null
};

var userLocation = {
	category: 'address',
	label: '',
	lat: 39.066379,
	lng: -94.519982,
	neighborhood: null,
	searchRadiusMiles: (0.25 * 1609.34),
	zoom: 16
};

var mapInfo = {
	viewHistory: [{
		Lat: userLocation.lat,
		Lng: userLocation.lng,
		Zoom: userLocation.zoom
	}]
};

var map = null;

function initMap (mapElementId) {
	
	var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	});
	
	var Esri_WorldStreetMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
	});
	
	map = L.map(mapElementId).setView(
		[
			userLocation.lat, 
			userLocation.lng
		],
		userLocation.zoom
	);
	map.worldCopyJump = false;
	$('#' + mapElementId).fadeIn(200);
	
	var baseLayers = {
		'Esri World Imagery': Esri_WorldImagery,
		'Esri World Street Map': Esri_WorldStreetMap
	};

	var overlayLayers = { };
	
	L.control.layers(baseLayers, overlayLayers).addTo(map);
	baseLayers['Esri World Street Map'].addTo(map);
	
	// Set click event on map
	map.on('click', function onMapClick (e) {
		if ($('#divSidebar').hasClass('active'))
			$('#divSidebar').removeClass('active');
	});
	
	// Set popup open event on map
	map.on('popupopen', function (e) {
		userLocation.category = 'address';
		searchMap(
			null,
			null,
			userLocation.category,
			e.popup._latlng.lat,
			e.popup._latlng.lng
		);
	});
	
	// Set map move end event
	map.on('moveend', function (e) {
		mapInfo.viewHistory.push({
			Lat: map.getCenter().lat,
			Lng: map.getCenter().lng,
			Zoom: map.getZoom()
		});
	});
	
	// Set map zoom end event
	map.on('zoomend', function() {
		mapInfo.viewHistory.push({
			Lat: map.getCenter().lat,
			Lng: map.getCenter().lng,
			Zoom: map.getZoom()
		});
	});
	
	// Add map legend control to map
	L.Control.MapLegend = L.Control.extend({
		onAdd: function (map) {
			var legendContainer = L.DomUtil.create('div');
			
			$(legendContainer).addClass('map-legend')
				.html(
					'<div class="map-legend-title"> Map Legend </div>' +
					'<div class="map-legend-row">' +
						'<img src="content/images/house-green.svg" />' +
						'<span> Good Condition </span>' +
					'</div>' +
					'<div class="map-legend-row">' +
						'<img src="content/images/house-orange.svg" />' +
						'<span> Fair Condition </span>' +
					'</div>' +
					'<div class="map-legend-row">' +
						'<img src="content/images/house-red.svg" />' + 
						'<span> Distressed Condition </span>' +
					'</div>' +
					'<div class="map-legend-row">' +
						'<img src="content/images/house-blue.svg" />' +
						'<span> Other Condition </span>' +
					'</div>' +
					'<div class="map-legend-row">' +
						'<img src="content/images/house-gray.svg" />' + 
						'<span> Outside Search Area </span>' +
					'</div>'
				);

			return legendContainer;
		},
		onRemove: function(map) { }
	});
	L.control.mapLegend = function (opts) {
		return new L.Control.MapLegend(opts);
	};
	L.control.mapLegend({ position: 'bottomright' }).addTo(map);
	
	// Add back view button control to map
	L.Control.BackView = L.Control.extend({
		onAdd: function (map) {
			var backViewButton = L.DomUtil.create('div');
			
			$(backViewButton).addClass('map-button map-back-view-button')
				.html('<i class="glyphicon glyphicon-zoom-in"></i>');

			$(backViewButton).bind('click', function () {
				
				console.log('Clicked back view button w/ map view history: ', mapInfo.viewHistory); // Debug
				
				if (mapInfo.viewHistory.length == 0) return;
				
				//mapInfo.viewHistory.pop(); // First pop is current view
				var backView = mapInfo.viewHistory.pop();
				if (isDefined(backView)) {
					map.setView([backView.Lat, backView.Lng], backView.Zoom);
					mapInfo.viewHistory.pop();
				}
			});
				
			return backViewButton;
		},
		onRemove: function(map) { }
	});
	L.control.backView = function (opts) {
		return new L.Control.BackView(opts);
	};
	L.control.backView({ position: 'topright' }).addTo(map);

	initMarkerIcons();
	
	refreshProperties();
}

function initMarkerIcons() {
	
	markerIcons.blueHouseIcon = L.icon({
		iconUrl: 'content/images/house-blue.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
	
	markerIcons.grayHouseIcon = L.icon({
		iconUrl: 'content/images/house-gray.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
	
	markerIcons.greenHouseIcon = L.icon({
		iconUrl: 'content/images/house-green.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
	
	markerIcons.greenHouseSoldIcon = L.icon({
		iconUrl: 'content/images/house-green-sold.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
	
	markerIcons.orangeHouseIcon = L.icon({
		iconUrl: 'content/images/house-orange.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
	
	markerIcons.orangeHouseSoldIcon = L.icon({
		iconUrl: 'content/images/house-orange-sold.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
	
	markerIcons.redHouseIcon = L.icon({
		iconUrl: 'content/images/house-red.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
	
	markerIcons.redHouseSoldIcon = L.icon({
		iconUrl: 'content/images/house-red-sold.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
}

function clearMap () {
	
	userLocation.category = null;
	
	if (isDefined(mapLayers.searchRadiusLayer))
		map.removeLayer(mapLayers.searchRadiusLayer);
	
	map.closePopup();
	
	refreshMarkers();
}

function searchMap (locationGid, locationName, locationCategory, locationLat, locationLng) {
	
	if (! isDefined(locationCategory)) locationCategory = 'city';
	
	// For address items, draw a search radius
	switch (locationCategory.toString().toLowerCase()) {
		
		case 'address':
			searchByAddress(locationGid, locationLat, locationLng);
			break;
	
		// For neighborhood and zip searches
		case 'nbrhd':
		case 'zip':
			map.closePopup();
			searchByNeighborhoodOrZip(locationGid);
			break;
			
		// For city searches
		case 'city':
			map.closePopup();
			searchByCity();
			break;
	}
}

function searchByAddress (locationGid, locationLat, locationLng) {
	
	var layerStyleFcn = function (feature) {
		return {
			fillColor: '#0064FF',
			weight: 3,
			opacity: 1.0,
			color: '#FFA100',
			fillOpacity: 0.3
		};
	};
	
	var setAddressSearchRadius = function (data) {
		
		if (!isDefined(data)) return;
		
		// Set map starting location
		if (isDefined(data.Lat) && isDefined(data.Lng)) {
			userLocation.lat = data.Lat;
			userLocation.lng = data.Lng;
			
			map.setView([
					userLocation.lat, 
					userLocation.lng
				],
				userLocation.zoom
			);    
		}
		
		refreshMarkers();
		
		if (isDefined(mapLayers.searchRadiusLayer))
			map.removeLayer(mapLayers.searchRadiusLayer);
		
		// If user is logged in, draw search radius circle
		if (app.loggedIn) {

			mapLayers.searchRadiusLayer = L.circle([
				userLocation.lat, 
				userLocation.lng
			], userLocation.searchRadiusMiles, layerStyleFcn());
			mapLayers.searchRadiusLayer.addTo(map);
			
		// If user is not logged in, draw the search property's encompasing neighborhood
		} else {
			
			service.getNeighborhoodGeojson(userLocation.neighborhood).then(function (results) {
				
				if (! isDefined(results)) return;
				
				try {
					results = JSON.parse(results);
					var geojson = JSON.parse(results.GeoJSON);
					
					mapLayers.searchRadiusLayer = new L.geoJson(geojson, { style: layerStyleFcn });
					mapLayers.searchRadiusLayer.addTo(map);
				} catch (ex) { }
			});
		}
		
		app.refreshSidebar();
	};
	
	if (isDefined(locationLat) && isDefined(locationLng)) {
		
		setAddressSearchRadius({ Lat: locationLat, Lng: locationLng });
		
	} else if (isDefined(locationGid)) {

		service.getAutocompleteItemLatLng(locationGid).then(function (results) {
			setAddressSearchRadius(JSON.parse(results));
		});
	}
}

function searchByNeighborhoodOrZip (locationGid) {
	
	var layerStyleFcn = function (feature) {
		return {
			fillColor: '#0064FF',
			weight: 3,
			opacity: 1.0,
			color: '#FFA100',
			fillOpacity: 0.3
		};
	};
	
	service.getAutocompleteItemGeojson(locationGid).then(function (results) {
		
		results = JSON.parse(results);
		var geojson = JSON.parse(results.GeoJSON);
		
		// Set map starting location
		if (isDefined(results) && isDefined(results.Lat) 
			&& isDefined(results.Lng)) {
			userLocation.lat = results.Lat;
			userLocation.lng = results.Lng;
		}
		
		userLocation.lat = results.CenterLat;
		userLocation.lng = results.CenterLng;
		
		map.setView([
				userLocation.lat, 
				userLocation.lng
			],
			userLocation.zoom
		);    
		
		refreshMarkers();
		
		if (mapLayers.searchRadiusLayer)
			map.removeLayer(mapLayers.searchRadiusLayer);						
		mapLayers.searchRadiusLayer = new L.geoJson(geojson, { style: layerStyleFcn });
		mapLayers.searchRadiusLayer.addTo(map);
		
		setTimeout(function () {
			app.refreshSidebar();
		}, 100);
		
		var geojsonBounds = L.geoJson(geojson).getBounds();
		map.fitBounds(geojsonBounds);
		
		setTimeout(function () {
			var mapZoom = map.getZoom();
			map.setZoom(mapZoom - 1);
		}, 100);
	});
}

function searchByCity () {
	
	if (mapLayers.searchRadiusLayer)
		map.removeLayer(mapLayers.searchRadiusLayer);
	
	refreshMarkers();
	
	var latLngPoints = [];

	for (var i = 0; i < mapLayers.markers.length; i++) 
		latLngPoints.push(mapLayers.markers[i].getLatLng());

	try {
		
		var bounds = new L.LatLngBounds(latLngPoints);
		self.map.fitBounds(bounds);
	} catch (ex) { }
}

function refreshMarkers () {
	
	for (var i = 0; i < mapLayers.markers.length; i++) {

		var propertyOutsideBounds = false;
		if (userLocation.category == 'address') {
			var propertyLocation = new L.LatLng(mapLayers.markers[i]._latlng.lat, mapLayers.markers[i]._latlng.lng);
			var userLatLng = new L.LatLng(userLocation.lat, userLocation.lng);
			propertyOutsideBounds = (userLatLng.distanceTo(propertyLocation) > userLocation.searchRadiusMiles);
		}
		
		var isSold = (mapLayers.markers[i].soldAvail.toLowerCase() == 'sold');
		
		var markerIcon = null;
		switch (mapLayers.markers[i].condition.toString().trim().toLowerCase()) {
			case 'good': markerIcon = (isSold) ? markerIcons.greenHouseSoldIcon : markerIcons.greenHouseIcon; break;
			case 'fair': markerIcon = (isSold) ? markerIcons.orangeHouseSoldIcon : markerIcons.orangeHouseIcon; break;
			case 'distressed': markerIcon = (isSold) ? markerIcons.redHouseSoldIcon : markerIcons.redHouseIcon; break;
			default: markerIcon = markerIcons.blueHouseIcon; break;
		}
		if (propertyOutsideBounds) markerIcon = markerIcons.grayHouseIcon;
		if (! markerIcon) continue;
		
		mapLayers.markers[i].setIcon(markerIcon);
	}
}

function refreshProperties () {
	
	var markerClickEvent = function (e) {

		var markerImg = $(e.target._icon);
		
		service.getPropertyDetails(e.target.propertyId).then(function (results) {
	
			var propertyDetails = JSON.parse(results);
	
			$('#txtTopSearch').val(propertyDetails.Address || '');
			
			userLocation.label = propertyDetails.Address;
			userLocation.neighborhood = propertyDetails.Neighborhood;
			
			// Set county parcel link
			var countyParcelLabel = 'View Parcel Information';
			var countyParcelLink = 'https://ascendweb.jacksongov.org';
			var parcelImageLink = 'http://maps.jacksongov.org/AscendPics/Pictures/';
			
			if (propertyDetails.APN.length == 19) {
				countyParcelLink = 'http://maps.jacksongov.org/PropertyReport/PropertyReport.cfm?pid=';
				var pid = propertyDetails.APN.replace(/(\D{2})(\d{2})(\d{3})(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})(\d{3})$/, "$2-$3-$4-$5-$6-$7-$8-$9");
				if (pid.length >= 6) parcelImageLink += pid.substr(0, 6) + '/' + pid + '_AA.jpg';
				countyParcelLink += pid;
				countyParcelLabel = pid;
			}

			var popup = L.popup()
				.setLatLng(e.latlng)
				.setContent(
					'<div class="map-popup-title" translate="property details"> Property Details </div>' +
					'<div class="map-popup-image">' +
						'<a href="' + parcelImageLink + '" target="_blank">' +
							'<img src="' + parcelImageLink + '" />' +
						'</a>' +
					'</div>' +
					'<div class="map-popup-content">' +
					
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label"> Address </div><div class="map-popup-item-value">' + (propertyDetails.Address || '-') + '</div>' + 
						'</div>' +
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label"> Property Type </div><div class="map-popup-item-value">' + (propertyDetails.PropClass || '-') + '</div>' + 
						'</div>' +
						
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label"> Zip Code </div><div class="map-popup-item-value">' + (propertyDetails.Zip || '-') + '</div>' + 
						'</div>' +
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label"> Condition </div><div class="map-popup-item-value">' + (propertyDetails.Condition || '-') + '</div>' + 
						'</div>' +
						
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label"> Neighborhood </div><div class="map-popup-item-value">' + (propertyDetails.Neighborhood || '-') + '</div>' + 
						'</div>' +
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label"> Market Value </div><div class="map-popup-item-value"> $' + (propertyDetails.MktvalDisplay || '-') + '</div>' + 
						'</div>' +
						
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label"> County Parcel Number </div><div class="map-popup-item-value">' +
							'<a href="' + countyParcelLink + '" target="_blank"> ' + countyParcelLabel + ' </a>' +
						'</div>' + 
						'</div>' +
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label"> Sqft </div><div class="map-popup-item-value">' + (propertyDetails.SqftDisplay || '-') + '</div>' + 
						'</div>' +
						
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label"> Sold / Available </div><div class="map-popup-item-value">' + (propertyDetails.SoldAvail || '-') + '</div>' + 
						'</div>' +
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label"> Year Acquired </div><div class="map-popup-item-value">' + (propertyDetails.YearAcq || '-') + '</div>' + 
						'</div>' +
						
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label"> Year Sold </div><div class="map-popup-item-value">' + (propertyDetails.YearsOld || '-') + '</div>' + 
						'</div>' +
					'</div>'
				).openOn(map);
				
			setTimeout(function () {
				markerImg.addClass('selected');
			}, 100);
		});
	};
	
	service.getMapProperties().then(function (results) {
		
		var propertyData = JSON.parse(results);
		
		mapLayers.markers = [];
		
		// Add properties to map as markers
		for (var i = 0; i < propertyData.length; i++) {
			
			if ((! isDefined(propertyData[i].Lat)) 
				|| (! isDefined(propertyData[i].Lng))) continue;
			
			var marker = L.marker([propertyData[i].Lat, propertyData[i].Lng], { });

			marker.propertyId = propertyData[i].PropertyId;
			marker.condition = propertyData[i].Condition;
			marker.soldAvail = propertyData[i].SoldAvail;
			marker.on('click', markerClickEvent);
			
			marker.addTo(map);
			
			mapLayers.markers.push(marker);
		}
		
		refreshMarkers();
	});

}
