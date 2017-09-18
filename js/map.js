
var map = null;

function initMap (mapElementId) {
	
	var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
	});
	
	var Esri_WorldStreetMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
	});

	map = L.map(mapElementId).setView(
		[39.0937, -94.5763], 
		11
	);    
	map.worldCopyJump = false;
	
	var baseLayers = {
		'Esri World Imagery': Esri_WorldImagery,
		'Esri World Street Map': Esri_WorldStreetMap
	};

	var overlayLayers = { };
	
	L.control.layers(baseLayers, overlayLayers).addTo(map);
	baseLayers['Esri World Street Map'].addTo(map);

	refreshProperties();
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
	
	var houseIcon = L.icon({
		iconUrl: 'content/images/house.png',
		//shadowUrl: 'leaf-shadow.png',

		iconSize:     [20, 20], // size of the icon
		shadowSize:   [0, 0], // size of the shadow
		iconAnchor:   [0, 0], // point of the icon which will correspond to marker's location
		shadowAnchor: [0, 0],  // the same for the shadow
		popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
	});
	
	// Add properties to map as markers
	for (var i = 0; i < propertyData.length; i++) {
		
		L.marker([propertyData[i].lat, propertyData[i].lng], {
			icon: houseIcon 
		}).addTo(map);
		//.bindPopup('Popup content')
		//.openPopup();
	}
}
