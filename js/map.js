
var mapLayers = {
	searchRadiusLayer: null
};
var map = null;
var userLocation = {
	category: 'address',
	label: '',
	lat: 39.066379,
	lng: -94.519982,
	searchRadiusMiles: (0.25 * 1609.34),
	zoom: 16
};

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
	
	refreshProperties();
}

function searchMap(locationGid, locationName, locationCategory, locationLat, locationLng) {
	
	if (! isDefined(locationCategory)) locationCategory = 'address';
	
	var layerStyleFcn = function (feature) {
		return {
			fillColor: '#0064FF',
			weight: 3,
			opacity: 1.0,
			color: '#FFA100',
			fillOpacity: 0.3
		};
	};
	
	// For address items, draw a search radius
	if (locationCategory.toString().toLowerCase() == 'address') {

		var setAddressSearchRadius = function (data) {
			
			if (!isDefined(data)) return;
			
			// Set map starting location
			if (isDefined(data.Lat) && isDefined(data.Lng)) {
				userLocation.lat = data.Lat;
				userLocation.lng = data.Lng;
			}
			
			if (isDefined(mapLayers.searchRadiusLayer))
				map.removeLayer(mapLayers.searchRadiusLayer);
			mapLayers.searchRadiusLayer = L.circle([
				userLocation.lat, 
				userLocation.lng
			], userLocation.searchRadiusMiles, layerStyleFcn());
			
			mapLayers.searchRadiusLayer.addTo(map);
			
			app.refreshSidebar();
		};
		
		if (isDefined(locationLat) && isDefined(locationLng)) {
			
			setAddressSearchRadius({ Lat: locationLat, Lng: locationLng });
			
		} else if (isDefined(locationGid)) {
	
			service.getAutocompleteItemLatLng(locationGid).then(function (results) {
				setAddressSearchRadius(JSON.parse(results));
			});
		}
	
	// For all other categories
	} else {
		
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
}

function refreshProperties () {
	
	var blueHouseIcon = L.icon({
		iconUrl: 'content/images/house-blue.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
	
	var greenHouseIcon = L.icon({
		iconUrl: 'content/images/house-green.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
	
	var orangeHouseIcon = L.icon({
		iconUrl: 'content/images/house-orange.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
	
	var redHouseIcon = L.icon({
		iconUrl: 'content/images/house-red.svg',
		iconSize:     [20, 20],
		shadowSize:   [0, 0],
		iconAnchor:   [0, 0],
		shadowAnchor: [0, 0],
		popupAnchor:  [0, 0]
	});
	
	var markerClickEvent = function (e) {

		service.getPropertyDetails(e.target.propertyId).then(function (results2) {
	
			var propertyDetails = JSON.parse(results2);
	
			var popup = L.popup()
				.setLatLng(e.latlng)
				.setContent(
					'<div style="border-bottom: 1px dotted #AAA; margin-bottom: 8px; font-size: 14px; font-weight: bold;"> Property Details </div>' +
					'<div style="min-width: 200px;">' +
						'<div style="text-transform: capitalize;"><b>Sold / Available </b>: ' + propertyDetails.SoldAvail + '</div>' + 
						'<div style="text-transform: capitalize;"><b>Condition</b>: ' + propertyDetails.Condition + '</div>' + 
						'<div style="text-transform: capitalize;"><b>Address</b>: ' + propertyDetails.Address + '</div>' + 
						'<div style="text-transform: capitalize;"><b>Neighborhood</b>: ' + propertyDetails.Neighborhood + '</div>' + 
						'<div style="text-transform: capitalize;"><b>Zip Code</b>: ' + propertyDetails.Zip + '</div>' + 
						'<div style="text-transform: capitalize;"><b>Sqft</b>: ' + propertyDetails.SqftDisplay + '</div>' + 
						'<div style="text-transform: capitalize;"><b>Market Value</b>: $' + propertyDetails.MktvalDisplay + '</div>' + 
					'</div>'
				)
				.openOn(map);
			
		});
	};
	
	service.getMapProperties().then(function (results) {
		
		var propertyData = JSON.parse(results);
		
		// Add properties to map as markers
		for (var i = 0; i < propertyData.length; i++) {
			
			if ((! isDefined(propertyData[i].Lat)) 
				|| (! isDefined(propertyData[i].Lng))) continue;
			
			var markerIcon = null;
			switch (propertyData[i].Condition.toString().trim().toLowerCase()) {
				case 'good': markerIcon = greenHouseIcon; break;
				case 'distressed': markerIcon = orangeHouseIcon; break;
				case 'fair': markerIcon = redHouseIcon; break;
				default: markerIcon = blueHouseIcon; break;
			}
			if (! markerIcon) continue;
			
			var marker = L.marker([propertyData[i].Lat, propertyData[i].Lng], {
				icon: markerIcon
			});
			marker.propertyId = propertyData[i].PropertyId;
			marker.on('click', markerClickEvent);
			marker.addTo(map);
			
			if (propertyData[i].PropClass) {
				var propClass = propertyData[i].PropClass.toString()
					.trim().toLowerCase().replace(/\s/g, '-');
				$($(marker)[0]._icon).addClass(propClass);
			}
		}
	});

}
