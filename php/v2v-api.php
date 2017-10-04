<?php
	
	error_reporting(E_ALL | E_STRICT);
	ini_set('display_errors', 'On');
	
	header('Access-Control-Allow-Headers: Content-Type');
	header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
	header('Access-Control-Allow-Origin: *');
	//header('Content-type: application/json', true);
	
	// Get action requested
	if (! isset($_REQUEST['action'])) die();
	
	check_access_key();
	
	switch ($_REQUEST['action'])
	{
		// Get methods
		case 'Autocomplete': autocomplete(); break;
		case 'GetAreaStatistics': get_area_statistics(); break;
		case 'GetAutocompleteItemGeojson': get_autocomplete_item_geojson(); break;
		case 'GetAutocompleteItemLatLng': get_autocomplete_item_lat_lng(); break;
		case 'GetMapProperties': get_map_properties(); break;
		case 'GetPropertyDetails': get_property_details(); break;
	}
	
	function check_access_key () {
		
		// List of allowed keys
		$keys = array(
			'D77C71BCE446924A2F7E1D21C44C7',	// Dev Key
		);
		
		// Get and check access key
		if ((! isset($_REQUEST['key'])) || (! in_array($_REQUEST['key'], $keys))) {
			echo(json_encode(array( 
				'error' => 'Invalid access key supplied')
			));
			die();
		}
	}
	
	// autocomplete - Returns autocomplete results for land bank properties based on a search string 
	function autocomplete ($search = null, $max_results = null) {
		
		$search = (isset($search)) ? $search : (isset($_REQUEST['Search']) ? pg_escape_string($_REQUEST['Search']) : null);
		$max_results = (isset($max_results)) ? $max_results : (isset($_REQUEST['MaxResults']) ? pg_escape_string($_REQUEST['MaxResults']) : 10);
		
		$query = "
			SELECT 
				  gid AS Gid
				, name AS Name
			FROM v2vtypeahead WHERE name ILIKE lower('%$search%')
			ORDER BY Name 
			LIMIT 10
		";
		
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		$area_stats = array();
		
		while ($row = pg_fetch_row($result)) {
			$area_stats[] = array(
				  'Gid' => $row[0]
				, 'Name' => $row[1]
			);
		}
		
		pg_close($conn);
		
		echo json_encode($area_stats);
	}
	
	// get_autocomplete_item_lat_lng - Gets the lat and long of a specified gid autocomplete address
	function get_autocomplete_item_lat_lng () {
		
		$gid = (isset($gid)) ? $gid : (isset($_REQUEST['Gid']) ? pg_escape_string($_REQUEST['Gid']) : null);

		$query = "
			SELECT 
				ST_Y(ST_Centroid(geom)) AS Lat,
				ST_X(ST_Centroid(geom)) AS Lon
			FROM v2vtypeahead WHERE gid = $gid
			ORDER BY Name 
			LIMIT 1
		";
		
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		
		$row = pg_fetch_row($result);
		$area_stats = array(
			  'Gid' => $gid
			, 'Lat' => $row[0]
			, 'Lng' => $row[1]
		);
		
		pg_close($conn);
		
		echo json_encode($area_stats);
	}
	
	// get_autocomplete_item_geojson - get the geojson geometry for an autocomplete item based on the specified gid
	function get_autocomplete_item_geojson ($gid = null) {
		
		$gid = (isset($gid)) ? $gid : (isset($_REQUEST['Gid']) ? pg_escape_string($_REQUEST['Gid']) : null);
		
		$query = "
			SELECT 
				ST_AsGeoJSON(geom) AS GeoJSON
			FROM v2vtypeahead WHERE gid = $gid
		";
		
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		$autocomplete_item_geojson = null;
		
		while ($row = pg_fetch_row($result)) {
			$autocomplete_item_geojson = array(
				'GeoJSON' => $row[0]
			);
		}
		
		pg_close($conn);
		
		echo json_encode($autocomplete_item_geojson);
	}
	
	// get_area_statistics - Gathers a number of statistics over a specified radius from a center point
	function get_area_statistics ($lat = null, $lng = null, $radius_miles = null) {
		
		$lat = (isset($lat)) ? $lat : (isset($_REQUEST['Lat']) ? pg_escape_string($_REQUEST['Lat']) : null);
		$lng = (isset($lng)) ? $lng : (isset($_REQUEST['Lng']) ? pg_escape_string($_REQUEST['Lng']) : null);
		$radius_miles = (isset($radius_miles)) ? $radius_miles : (isset($_REQUEST['Radius']) ? pg_escape_string($_REQUEST['Radius']) : null);
		
		$query = "
			SELECT
				  COUNT(*) AS PropertyCount
				, ROUND(AVG(CAST(yearacq AS INT)), 0) AS AverageYearsOld 		-- Average years old
				, ROUND(AVG(CAST(yearsold AS INT)), 0) AS AverageYearAcquired	-- Average year acquired
				, ROUND(AVG(CAST(mktval AS INT)), 2) AS MarketValue 			-- Market Value
				, ROUND(AVG(CAST(sqft AS INT)), 2) AS Sqft 						-- Square Feet
			FROM landbankprops
			WHERE ST_Distance_Sphere(geom, ST_MakePoint($lng, $lat)) <= $radius_miles
		";
		
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		$area_stats = null;
		
		while ($row = pg_fetch_row($result)) {
			$area_stats = array(
				  'PropertyCount' => $row[0]
				, 'AverageYearsOld' => 	$row[1]
				, 'AverageYearAcquired' => 	$row[2]
				, 'MarketValue' => 	$row[3]
				, 'Sqft' => 	$row[4]
			);
		}
		
		pg_close($conn);
		
		echo json_encode($area_stats);	
	}
	
	// get_properties - Gets map display property
	function get_map_properties () {
		
		$query = "
			SELECT
				  gid
				, lat
				, lon
				, propclass
			FROM public.landbankprops
			WHERE (1 = 1)
			AND ((propclass ILIKE '%commercial improved%') OR (propclass ILIKE '%commercial vacant%')
			 OR (propclass ILIKE '%residential improved%') OR (propclass ILIKE '%residential vacant%'))
			ORDER BY zoned
			LIMIT 1500
		";
		
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		$properties = array();
		
		while ($row = pg_fetch_row($result)) {
			$properties[] = array(
				  'PropertyId' => $row[0]
				, 'Lat' => 	$row[1]
				, 'Lng' => 	$row[2]
				, 'PropClass' => $row[3]
			);
		}
		
		pg_close($conn);
		
		echo json_encode($properties);	
	}
	
	// get_property_detail - Gets all relevant info for a single property
	function get_property_details ($propertyId = null) {

		$propertyId = (isset($propertyId)) ? $propertyId : (isset($_REQUEST['PropertyId']) ? pg_escape_string($_REQUEST['PropertyId']) : null);
	
		$query = "
			SELECT
				  gid
				, recordid
				, tract
				, blockgrp
				, cityblock
				, address
				, apn
				, lat
				, lon
				, yearacq
				, yearsold
				, lbsugroups
				, pclasscd
				, pstatcd
				, lbgrpcond
				, lbmatchcdg
				, propclass
				, propstat
				, invtype
				, zoned
				, zip
				, neigh
				, cncldist
				, acqdate
				, solddate
				, city
				, state
				, county
				, schoold
				, potentuse
				, mktvalyr
				, mktval
				, sqft
				, yrforcls
				, propcond
				, geoid
				, hundredblo
				, city_block
			FROM public.landbankprops
			WHERE gid = $propertyId;
		";
			
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');

		$row = pg_fetch_row($result);
		$propertyDetails = array(
			  'PropertyId' => $row[0]
			, 'Recordid' => $row[1]
			, 'Tract' => $row[2]
			, 'Blockgrp' => $row[3]
			, 'Cityblock' => $row[4]
			, 'Address' => $row[5]
			, 'Apn' => $row[6]
			, 'Lat' => $row[7]
			, 'Lon' => $row[8]
			, 'Yearacq' => $row[9]
			, 'Yearsold' => $row[10]
			, 'Lbsugroups' => $row[11]
			, 'Pclasscd' => $row[12]
			, 'Pstatcd' => $row[13]
			, 'Lbgrpcond' => $row[14]
			, 'Lbmatchcdg' => $row[15]
			, 'PropClass' => $row[16]
			, 'Propstat' => $row[17]
			, 'Invtype' => $row[18]
			, 'Zoned' => $row[19]
			, 'Zip' => $row[20]
			, 'Neigh' => $row[21]
			, 'Cncldist' => $row[22]
			, 'Acqdate' => $row[23]
			, 'Solddate' => $row[24]
			, 'City' => $row[25]
			, 'State' => $row[26]
			, 'County' => $row[27]
			, 'Schoold' => $row[28]
			, 'Potentuse' => $row[29]
			, 'Mktvalyr' => $row[30]
			, 'Mktval' => $row[31]
			, 'MktvalDisplay' => number_format($row[31], 2, '.', ',')
			, 'Sqft' => $row[32]
			, 'SqftDisplay' => number_format($row[32], 2, '.', ',')
			, 'Yrforcls' => $row[33]
			, 'Propcond' => $row[34]
			, 'Geoid' => $row[35]
			, 'Hundredblo' => $row[36]
			, 'City_block' => $row[37]
		);
		
		pg_close($conn);
		
		echo json_encode($propertyDetails);	
	}
	
	function get_postgresql_db_connection ($db_name='postgres') {
		
		// AAGIS PostgreSQL Server
		$host = '45.40.137.203';
		$port = '5432';
		$user = 'geoadmin2';
		$password = 'geo9126';

		$pgdbconn = pg_connect("
			host=$host 
			port=$port 
			dbname=$db_name 
			user=$user 
			password=$password
		") or die ('An error occurred.\n');
		
		return $pgdbconn;
	}

?>
