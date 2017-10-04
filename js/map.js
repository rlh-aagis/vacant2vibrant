
var map = null;
var userLocation = {
	lat: 39.066379,
	lng: -94.519982,
	radiusMiles: (0.25 * 1609.34),
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
	
	refreshProperties();
	initAreaStatisticsRadius();
}

function initAreaStatisticsRadius () {
	
	L.circle([
			userLocation.lat, 
			userLocation.lng
		], 
		userLocation.radiusMiles/*,
		{
			color: 'rgba(255, 255, 255, 0.3)',
			fillColor: 'rgba(0, 120, 205, 0.65)',
			fillOpacity: 0.5
		}
		*/
	).addTo(map);
}

function refreshProperties () {
	
	// Get test property data
	var propertyData = [
		{ 
			address: '123 Main St',
			lat: 39.024923, 
			lng: -94.564466
		}, { 
			address: '124 Main St',
			lat: 39.028311, 
			lng: -94.556446
		}, { 
			address: '126 Main St',
			lat: 39.019643, 
			lng: -94.576273
		}, { 
			address: '130 Main St',
			lat: 39.017409, 
			lng: -94.548893
		}
	];
	
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
	
	//leaflet-marker-icon
	
	var markerClickEvent = function (e) {

		service.getPropertyDetails(e.target.propertyId).then(function (results2) {
	
			var propertyDetails = JSON.parse(results2);
	
			var popup = L.popup()
				.setLatLng(e.latlng)
				.setContent(
					'<div style="border-bottom: 1px dotted #AAA; margin-bottom: 8px; font-size: 14px; font-weight: bold;"> Property Details </div>' +
					'<div style="min-width: 200px;">' +
						'<div><b>Property Type</b>: ' + propertyDetails.PropClass + '</div>' + 
						'<div><b>Address</b>: ' + propertyDetails.Address + '</div>' + 
						'<div><b>City</b>: ' + propertyDetails.City + '</div>' + 
						'<div><b>State</b>: ' + propertyDetails.State + '</div>' + 
						'<div><b>County</b>: ' + propertyDetails.County + '</div>' + 
						'<div><b>Sqft</b>: ' + propertyDetails.SqftDisplay + '</div>' + 
						'<div><b>Market Value</b>: $' + propertyDetails.MktvalDisplay + '</div>' + 
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
			switch (propertyData[i].PropClass.toString().trim().toLowerCase()) {
				case 'commercial vacant': markerIcon = greenHouseIcon; break;
				case 'commercial improved': markerIcon = blueHouseIcon; break;
				case 'residential vacant': markerIcon = orangeHouseIcon; break;
				case 'residential improved': markerIcon = redHouseIcon; break;
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
