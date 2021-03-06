
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
	searchRadiusLayer: null,
	selectedMarker: null
};

var userLocation = {
	category: 'address',
	label: '',
	lat: 39.066379,
	lng: -94.519982,
	neighborhood: null,
	searchRadiusMiles: (0.25 * 1609.34),
	zoom: 14
};

var mapInfo = {
	radiusType: 'quarter-mile',
	viewHistory: [{
		Lat: userLocation.lat,
		Lng: userLocation.lng,
		Zoom: userLocation.zoom
	}]
};

var layerControl = null;
var map = null;

function initMap (mapElementId) {
	
	var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	});
	
	var OpenStreetMap_DE = L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	});
	
	var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
		maxZoom: 17,
		attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
	});
	
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
		'Street View 1': OpenStreetMap_Mapnik,
		'Street View 2': OpenTopoMap,
		'Aerial View': Esri_WorldImagery
	};

	var overlayLayers = { };
	
	layerControl = L.control.layers(baseLayers, overlayLayers, { collapsed: false }).addTo(map);
	setTimeout(function () {
		var minimizeButton = $('<div class="minimize-button">_</div>');
		minimizeButton.bind('click', function () {
			if ($('.leaflet-control-layers').hasClass('leaflet-control-layers-expanded')) {
				layerControl.collapse();
			} else {
				layerControl.expand();
			}
		});
		$('.leaflet-control-layers').append(minimizeButton);
	}, 100);
	baseLayers['Street View 1'].addTo(map);
	
	// Set click event on map
	map.on('click', function onMapClick (e) {
		if ($('#divSidebar').hasClass('active'))
			$('#divSidebar').removeClass('active');
		
		$('#divSideBarMenuToggle .sub_icon')
			.removeClass('glyphicon-chevron-left')
			.addClass('glyphicon-chevron-right');
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
			
			$(legendContainer).addClass('map-legend map-legend-expanded')
				.html(
					'<div class="map-legend-title" translate="map legend"> Map Legend </div>' +
					'<div class="map-legend-row">' +
						'<img src="content/images/house-green.svg" />' +
						'<span translate="good condition"> Good Condition </span>' +
					'</div>' +
					'<div class="map-legend-row">' +
						'<img src="content/images/house-orange.svg" />' +
						'<span translate="fair condition"> Fair Condition </span>' +
					'</div>' +
					'<div class="map-legend-row">' +
						'<img src="content/images/house-red.svg" />' + 
						'<span translate="distressed condition"> Distressed Condition </span>' +
					'</div>' +
					'<div class="map-legend-row">' +
						'<img src="content/images/house-blue.svg" />' +
						'<span translate="other condition"> Other Condition </span>' +
					'</div>' +
					'<div class="map-legend-row">' +
						'<img src="content/images/house-gray.svg" />' + 
						'<span translate="outside search area"> Outside Search Area </span>' +
					'</div>' +
					'<div class="map-legend-row">' +
						'<img src="content/images/house-outline-sold.svg" />' + 
						'<span translate="sold"> Sold </span>' +
					'</div>' +
					'<div class="map-legend-icon"><i class="glyphicon glyphicon-list"></div>'
				);

				setTimeout(function () {
					var minimizeButton = $('<div class="minimize-button">_</div>');
					minimizeButton.bind('click', function (event) {
						event.preventDefault();
						event.stopPropagation();
						$('.map-legend').toggleClass('map-legend-expanded');
					});
					$(legendContainer).append(minimizeButton);
					
					$(legendContainer).bind('click', function (event)  {
						event.preventDefault();
						event.stopPropagation();
						if (! $(this).hasClass('map-legend-expanded'))
							$(this).addClass('map-legend-expanded');
					});
				}, 100);
				
			setTimeout(function () {
				translate('.map-legend');
			}, 300);
				
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
				.html('<i class="glyphicon glyphicon-zoom-in" title="Go to previous map view"></i>');

			$(backViewButton).bind('click', function () {
				
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

	// Add search settings button control to map
	L.Control.MapSettings = L.Control.extend({
		onAdd: function (map) {
			var mapSettingsButton = L.DomUtil.create('div');
			
			$(mapSettingsButton).addClass('map-button map-settings-button').html(
				'<i class="glyphicon glyphicon-cog" title="Search Settings" style="left: 3px; top: 2px;"></i>' +
				'<div class="map-settings-content">' +
					'<div style="margin: 0 0 8px 0;" translate="map search type preferred"> Map Search Type Preferred </div>' +
					'<div class="toggle-value-label"> 0.25 Mile </div>' +
					'<label class="switch">' +
						'<input type="checkbox" onchange="toggleRadiusType()">' +
						'<span class="slider round"></span>' +
					'</label>' +
					'<div class="toggle-value-label" translate="neighborhood"> Neighborhood </div>' +
				'</div>'
			);
			
			translate('.map-button');

			$(mapSettingsButton).bind('click', function () {
				$('.map-settings-content').toggle();
			});
				
			return mapSettingsButton;
		},
		onRemove: function(map) { }
	});
	L.control.mapSettings = function (opts) {
		return new L.Control.MapSettings(opts);
	};
	L.control.mapSettings({ position: 'topright' }).addTo(map);
	
	initMarkerIcons();
	
	refreshProperties();
}

function toggleRadiusType () {
	if (mapInfo.radiusType == 'quarter-mile') {
		mapInfo.radiusType = 'neighborhood';
	} else {
		mapInfo.radiusType = 'quarter-mile';
	}
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
			userLocation.neighborhood = locationName;
		case 'zip':
			map.closePopup();
			searchByNeighborhoodOrZip(locationName);
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
				map.getZoom()
			);    
		}
		
		if (isDefined(mapLayers.searchRadiusLayer))
			map.removeLayer(mapLayers.searchRadiusLayer);
		
		// If user is logged in, draw search radius circle
		if (mapInfo.radiusType != 'neighborhood') {

			mapLayers.searchRadiusLayer = L.circle([
				userLocation.lat, 
				userLocation.lng
			], userLocation.searchRadiusMiles, layerStyleFcn());
			mapLayers.searchRadiusLayer.addTo(map);

			map.fitBounds(mapLayers.searchRadiusLayer.getBounds());
			
			setTimeout(function () {
				map.setZoom(map.getZoom() - 1);
			}, 100);
						
			refreshMarkers(locationGid);
			
		// If user is not logged in, draw the search property's encompasing neighborhood
		} else if (isDefined(locationGid)) {
			
			service.getAddressNeighborhoodGeojson(locationGid).then(function (results) {
				
				if (! isDefined(results)) return;
				
				try {
					results = JSON.parse(results);
					var geojson = JSON.parse(results.GeoJSON);
					
					mapLayers.searchRadiusLayer = new L.geoJson(geojson, { style: layerStyleFcn });
					mapLayers.searchRadiusLayer.addTo(map);
					
					setTimeout(function () {
						map.fitBounds(mapLayers.searchRadiusLayer.getBounds());
						refreshMarkers(locationGid);
					}, 100);
					
				} catch (ex) { }
			});
		} else {
			
			service.getNeighborhoodGeojson(userLocation.neighborhood).then(function (results) {
				
				if (! isDefined(results)) return;
				
				try {
					results = JSON.parse(results);
					var geojson = JSON.parse(results.GeoJSON);
					
					if (isDefined(geojson)) {
						
						mapLayers.searchRadiusLayer = new L.geoJson(geojson, { style: layerStyleFcn });
						mapLayers.searchRadiusLayer.addTo(map);
						
						setTimeout(function () {
							map.fitBounds(mapLayers.searchRadiusLayer.getBounds());
							refreshMarkers(locationGid);
						}, 100);
					}
					
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

function searchByNeighborhoodOrZip (locationName) {
	
	var layerStyleFcn = function (feature) {
		return {
			fillColor: '#0064FF',
			weight: 3,
			opacity: 1.0,
			color: '#FFA100',
			fillOpacity: 0.3
		};
	};
	
	service.getAutocompleteItemGeojson(locationName).then(function (results) {
		
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
			map.getZoom()
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
			map.setZoom(map.getZoom() - 1);
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

function refreshMarkers (selectedPropertyId) {
	
	for (var i = 0; i < mapLayers.markers.length; i++) {

		var propertyLocation = new L.LatLng(mapLayers.markers[i]._latlng.lat, mapLayers.markers[i]._latlng.lng);
		var propertyOutsideBounds = false;
		
		if ((userLocation.category == 'address') && (mapInfo.radiusType != 'neighborhood')) {
			var userLatLng = new L.LatLng(userLocation.lat, userLocation.lng);
			propertyOutsideBounds = (userLatLng.distanceTo(propertyLocation) > userLocation.searchRadiusMiles);
		} else if ((userLocation.category == 'address') && (isDefined(mapLayers.searchRadiusLayer))) {
			
			propertyOutsideBounds = (leafletPip.pointInLayer(propertyLocation, mapLayers.searchRadiusLayer, true).length == 0);
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

		if ((mapLayers.markers[i] == mapLayers.selectedMarker) 
			|| (mapLayers.markers[i].propertyId == selectedPropertyId)) {
			$(mapLayers.markers[i]._icon).trigger('click');
			$(mapLayers.markers[i]._icon).addClass('selected');
		}
		
		$(mapLayers.markers[i]._icon).attr('data-index', i);
		$(mapLayers.markers[i]._icon).unbind('mouseenter.movalue').bind('mouseenter.movalue', function () {
			var hoverLabel = $('<div class="leaflet-marker-hover-label"> ' + 
				mapLayers.markers[$(this).attr('data-index')].address + '<br/>$' + 
				mapLayers.markers[$(this).attr('data-index')].marketValue + 
			'</div>');
			hoverLabel.css({ 'left': $(this).position().left + 30, 'top': $(this).position().top });
			$(this).after(hoverLabel);
		});
		$(mapLayers.markers[i]._icon).unbind('mouseleave.movalue').bind('mouseleave.movalue', function () {
			$(this).next('.leaflet-marker-hover-label').remove();
		});
		
		mapLayers.selectedMarker = null;
	}
}

function refreshProperties () {
	
	var markerClickEvent = function (e) {
	
		mapLayers.selectedMarker = e.target;
		var markerImg = $(e.target._icon);
		
		L.DomEvent.disableClickPropagation(mapLayers.selectedMarker);
		
		service.getPropertyDetails(e.target.propertyId).then(function (results) {
	
			var propertyDetails = JSON.parse(results);
	
			$('#txtTopSearch').val(propertyDetails.Address || '');
			
			userLocation.label = propertyDetails.Address;
			userLocation.neighborhood = propertyDetails.Neighborhood;
			
			// Set city parcel viewer link
			var cityParcelViewerLink = 'http://maps.kcmo.org/apps/parcelviewer/' + 
				(isDefined(propertyDetails.KivaPIN) ? ('?kiva=' + propertyDetails.KivaPIN) : '');
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

			var popup = L.responsivePopup()
				.setLatLng(e.latlng)
				.setContent(
					'<div class="map-popup-title" translate="property details"> Property Details </div>' +
					'<div class="map-popup-image">' +
						'<a href="' + parcelImageLink + '" target="_blank">' +
							'<img src="' + parcelImageLink + '" onerror="this.src=\'content/images/image-not-available.png\'" />' +
						'</a>' +
					'</div>' +
					'<div class="map-popup-content">' +
					
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label" translate="address"> Address </div>' + 
						'<div class="map-popup-item-value">' + (propertyDetails.Address || '-') + '</div>' + 
						'</div>' +
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label" translate="property type"> Property Type </div>' + 
						'<div class="map-popup-item-value">' + (propertyDetails.PropClass || '-') + '</div>' + 
						'</div>' +
						
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label" translate="zip code"> Zip Code </div>' + 
						'<div class="map-popup-item-value">' + (propertyDetails.Zip || '-') + '</div>' + 
						'</div>' +
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label" translate="condition"> Condition </div>' + 
						'<div class="map-popup-item-value">' + (propertyDetails.Condition || '-') + '</div>' + 
						'</div>' +
						
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label" translate="neighborhood"> Neighborhood </div>' + 
						'<div class="map-popup-item-value">' + (propertyDetails.Neighborhood || '-') + '</div>' + 
						'</div>' +
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label" translate="market value"> Market Value </div>' + 
						'<div class="map-popup-item-value"> $' + (propertyDetails.MktvalDisplay || '-') + '</div>' + 
						'</div>' +
						
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label" translate="link to county data"> Link to County Data </div>' + 
						'<div class="map-popup-item-value">' +
							'<a href="' + countyParcelLink + '" target="_blank"> ' + countyParcelLabel + ' </a>' +
						'</div>' + 
						'</div>' +
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label" translate="sqft"> Lot Sqft </div>' + 
						'<div class="map-popup-item-value">' + (propertyDetails.SqftDisplay || '-') + '</div>' + 
						'</div>' +
						
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label" translate="sold/unsold"> Sold/Unsold </div>' + 
						'<div class="map-popup-item-value">' + (propertyDetails.SoldAvail || '-') + '</div>' + 
						'</div>' +
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label" translate="year acquired"> Year Acquired </div>' + 
						'<div class="map-popup-item-value">' + (propertyDetails.YearAcq || '-') + '</div>' + 
						'</div>' +
						
						'<div class="map-popup-item">' + 
						'<div class="map-popup-item-label" translate="year sold"> Year Sold </div>' + 
						'<div class="map-popup-item-value">' + (propertyDetails.YearsOld || '-') + '</div>' + 
						'</div>' +
						
						'<div class="map-popup-item ">' +
							'<a href="' + cityParcelViewerLink + '" target="_blank" translate="kansas city parcel viewer">' + 
								'Kansas City Parcel Viewer' + 
							'</a>' + 
							((propertyDetails.SoldAvail.toLowerCase() == 'unsold') ? 
							('<br/><a href="https://public-kclb.epropertyplus.com/landmgmtpub/remote/public/property/viewSummary?parcelNumber=' + propertyDetails.APN + '" target="_blank" translate="kcmo land bank">' + 
								'KCMO Land Bank' +
							'</a>') : '') +
						'</div>' +
					'</div>'
				).openOn(map);
				
				translate('.map-popup-title');
				translate('.map-popup-content');
				
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
			marker.marketValue = propertyData[i].MarketValue;
			marker.address = propertyData[i].Address;
			marker.on('click', markerClickEvent);
			
			marker.addTo(map);
			
			mapLayers.markers.push(marker);
		}
		
		refreshMarkers();
	});

}
