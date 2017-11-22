<?php

	require_once('conn.php');

	if (! session_id()) session_start();
	
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
		case 'GetAreaStatisticsByLocation': get_area_statistics_by_location(); break;
		case 'GetAreaStatisticsByNeighborhood': get_area_statistics_by_neighborhood(); break;
		case 'GetAreaStatisticsByZipCode': get_area_statistics_by_zip_code(); break;
		case 'GetAutocompleteItemGeojson': get_autocomplete_item_geojson(); break;
		case 'GetAutocompleteItemLatLng': get_autocomplete_item_lat_lng(); break;
		case 'GetMapProperties': get_map_properties(); break;
		case 'GetNeighborhoodGeojson': get_neighborhood_geojson(); break;
		case 'GetAddressNeighborhoodGeojson': get_address_neighborhood_geojson(); break;
		case 'GetPropertyDetails': get_property_details(); break;
	}
	
	// autocomplete - Returns autocomplete results for land bank properties based on a search string 
	function autocomplete ($search = null, $max_results = null) {
		
		$max_results = (isset($max_results)) ? $max_results : (isset($_REQUEST['MaxResults']) ? pg_escape_string($_REQUEST['MaxResults']) : 10);
		$search = (isset($search)) ? $search : (isset($_REQUEST['Search']) ? pg_escape_string($_REQUEST['Search']) : null);
		$search = strtoupper($search);
		
		$query = "
			SELECT 
				  COALESCE(LBP1.gid, Z.gid, N.gid, TA.gid) AS Gid
				, TA.name AS Name
				, TA.category AS Category
			FROM v2vtypeahead TA
			LEFT OUTER JOIN landbankprops LBP1 ON (TA.name ILIKE LBP1.address)
			LEFT OUTER JOIN v2vzipcode Z ON (TA.name ILIKE ('%' || Z.zipcode || '%'))
			LEFT OUTER JOIN v2vneighborhood N ON (TA.name ILIKE ('%' || N.neighshape || '%'))
			WHERE (1 = 1)
			AND (((category ILIKE '%address%') AND (LBP1.address LIKE '%$search%'))
			OR (category ILIKE '%zip%')
			OR (category ILIKE '%nbrhd%'))
			AND (TA.name ILIKE '%$search%')
			AND (TA.active = 1)
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
				, 'Category' => $row[2]
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
				  lat
				, lon
			FROM landbankprops LBP
			WHERE gid = $gid
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
	
	// get_autocomplete_item_geojson - get the geojson geometry for an autocomplete item based on the specified name
	function get_autocomplete_item_geojson ($name = null) {
		
		$name = (isset($name)) ? $name : (isset($_REQUEST['Name']) ? pg_escape_string($_REQUEST['Name']) : null);
		
		$query = "
			SELECT 
				  category
				, ST_Y(ST_Centroid(geom)) AS CenterLat
				, ST_X(ST_Centroid(geom)) AS CenterLng	  
				, ST_AsGeoJSON(geom) AS GeoJSON
			FROM v2vtypeahead 
			WHERE (1 = 1)
			AND (name ILIKE '%$name%') 
			AND (active = 1)
		";
		
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		$autocomplete_item_geojson = null;
		
		while ($row = pg_fetch_row($result)) {
			$autocomplete_item_geojson = array(
				'Category' => $row[0],
				'CenterLat' => $row[1],
				'CenterLng' => $row[2],
				'GeoJSON' => $row[3]
			);
		}
		
		pg_close($conn);
		
		echo json_encode($autocomplete_item_geojson);
	}
	
	// get_neighborhood_geojson - get the geojson geometry for a neighborhood based on a specified neighborhood name
	function get_neighborhood_geojson ($neighborhood_name = null) {
		
		$neighborhood_name = (isset($neighborhood_name)) ? $neighborhood_name : (isset($_REQUEST['NeighborhoodName']) ? pg_escape_string($_REQUEST['NeighborhoodName']) : null);
		
		$query = "
			SELECT 
				ST_AsGeoJSON(geom) AS GeoJSON
			FROM v2vneighborhood WHERE neighshape ILIKE '$neighborhood_name'
			LIMIT 1
		";
		
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		
		$neighborhood_geojson = null;
		$row = pg_fetch_row($result);
		$neighborhood_geojson = array(
			'GeoJSON' => $row[0]
		);
		
		pg_close($conn);
		
		echo json_encode($neighborhood_geojson);
	}
	
	// get_address_neighborhood_geojson - get the geojson geometry for a neighborhood based on a specified address gid
	function get_address_neighborhood_geojson ($gid = null) {
		
		$gid = (isset($gid)) ? $gid : (isset($_REQUEST['Gid']) ? pg_escape_string($_REQUEST['Gid']) : null);
		
		$query = "
			SELECT 
				ST_AsGeoJSON(H.geom) AS GeoJSON 
			FROM landbankprops LBP 
			LEFT OUTER JOIN v2vneighborhood H ON (LBP.neigh ILIKE neighshape) 
			WHERE (LBP.gid = $gid) 
			LIMIT 1 
		";
		
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		
		$neighborhood_geojson = null;
		$row = pg_fetch_row($result);
		$neighborhood_geojson = array(
			'GeoJSON' => $row[0]
		);
		
		pg_close($conn);
		
		echo json_encode($neighborhood_geojson);
	}
	
	// get_area_statistics_by_location - Gathers a number of statistics over a specified radius from a center point
	function get_area_statistics_by_location ($lat = null, $lng = null, $radius_miles = null) {
		
		$lat = (isset($lat)) ? $lat : (isset($_REQUEST['Lat']) ? pg_escape_string($_REQUEST['Lat']) : null);
		$lng = (isset($lng)) ? $lng : (isset($_REQUEST['Lng']) ? pg_escape_string($_REQUEST['Lng']) : null);
		$radius_miles = (isset($radius_miles)) ? $radius_miles : (isset($_REQUEST['Radius']) ? pg_escape_string($_REQUEST['Radius']) : null);
		$radius_type = (isset($radius_type)) ? $radius_type : (isset($_REQUEST['RadiusType']) ? pg_escape_string($_REQUEST['RadiusType']) : null);

		// Include additional details if the user is logged in
		$quintiles_query = ($radius_type != 'neighborhood') ? 
			" (SELECT 
				  AVG(CAST(absshnum AS FLOAT)) AS AbsenteeOwnerShares
				, AVG(CAST(abs_qr_des AS FLOAT)) AS AbsenteeOwnerSharesQnt
				, AVG(CAST(avgassval AS FLOAT)) AS AverageAssessedValue
				, AVG(CAST(avgav_qrd AS FLOAT)) AS AverageAssessedValueQnt
				, AVG(CAST(visible AS FLOAT)) AS StreetVisible311Calls
				, AVG(CAST(viz3_qra AS FLOAT)) AS StreetVisible311CallsQnt
				, AVG(CAST(pvvis AS FLOAT)) AS StreetVisiblePropertyViolations
				, AVG(CAST(pvis_qra AS FLOAT)) AS StreetVisiblePropertyViolationsQnt
				, AVG(CAST(crperson AS FLOAT)) AS CrimesAgainstPersons
				, AVG(CAST(crper_qra AS FLOAT)) AS CrimesAgainstPersonsQnt
				, AVG(CAST(crprop AS FLOAT)) AS CrimesAgainstProperty
				, AVG(CAST(cprop_qra AS FLOAT)) AS CrimesAgainstPropertyQnt
				, AVG(CAST(add1f AS FLOAT)) AS SingleFamilyBPAdditions
				, AVG(CAST(bpa1f_qra AS FLOAT)) AS SingleFamilyBPAdditionsQnt
			FROM public.quintilecityblock Q 
			WHERE ST_Intersects(Q.geom, 
				ST_Buffer(ST_MakePoint($lng, $lat)::geography, 402.336)) 
			LIMIT 1)"
			:
			" (SELECT 
				  AVG(CAST(absshnum AS FLOAT)) AS AbsenteeOwnerShares
				, AVG(CAST(abs_qr_des AS FLOAT)) AS AbsenteeOwnerSharesQnt
				, AVG(CAST(avgassval AS FLOAT)) AS AverageAssessedValue
				, AVG(CAST(avgav_qrd AS FLOAT)) AS AverageAssessedValueQnt
				, AVG(CAST(visible AS FLOAT)) AS StreetVisible311Calls
				, AVG(CAST(viz3_qra AS FLOAT)) AS StreetVisible311CallsQnt
				, AVG(CAST(pvvis AS FLOAT)) AS StreetVisiblePropertyViolations
				, AVG(CAST(pvis_qra AS FLOAT)) AS StreetVisiblePropertyViolationsQnt
				, AVG(CAST(crperson AS FLOAT)) AS CrimesAgainstPersons
				, AVG(CAST(crper_qra AS FLOAT)) AS CrimesAgainstPersonsQnt
				, AVG(CAST(crprop AS FLOAT)) AS CrimesAgainstProperty
				, AVG(CAST(cprop_qra AS FLOAT)) AS CrimesAgainstPropertyQnt
				, AVG(CAST(add1f AS FLOAT)) AS SingleFamilyBPAdditions
				, AVG(CAST(bpa1f_qra AS FLOAT)) AS SingleFamilyBPAdditionsQnt
			FROM public.quintilecityblock Q 
			WHERE ST_Intersects(Q.geom, (SELECT 
				geom 
				FROM public.v2vneighborhood N 
				WHERE (neighshape ILIKE (SELECT neighshape 
					FROM public.v2vneighborhood N 
					WHERE ST_Contains( 
						  ST_SetSRID(N.geom, 4326) 
						, ST_SetSRID(ST_MakePoint($lng, $lat), 4326) 
					) LIMIT 1)
				))) 
			LIMIT 1)";
			
		$where_condition = ($radius_type != 'neighborhood') ?
			" AND (ST_Distance_Sphere(geom, ST_MakePoint($lng, $lat)) <= $radius_miles)" :
			" AND (neigh ILIKE ( 
				SELECT neighshape 
				FROM public.v2vneighborhood N 
				WHERE ST_Contains( 
					  ST_SetSRID(N.geom, 4326) 
					, ST_SetSRID(ST_MakePoint($lng, $lat), 4326) 
				) LIMIT 1 
			))";
			
		$query = "
			SELECT 
				  (SELECT COUNT(*) FROM landbankprops LBP2
					WHERE (1 = 1) 
					AND (LBP2.sold_avail ILIKE 'disp%')
					$where_condition) AS SoldPropertyCount 
				, (SELECT COUNT(*) FROM landbankprops LBP2
					WHERE (1 = 1) 
					AND (LBP2.sold_avail ILIKE 'unsold%')
					$where_condition) AS UnsoldPropertyCount 
				, Qnt.AbsenteeOwnerShares
				, Qnt.AbsenteeOwnerSharesQnt
				, Qnt.AverageAssessedValue
				, Qnt.AverageAssessedValueQnt
				, Qnt.StreetVisible311Calls
				, Qnt.StreetVisible311CallsQnt
				, Qnt.StreetVisiblePropertyViolations
				, Qnt.StreetVisiblePropertyViolationsQnt
				, Qnt.CrimesAgainstPersons
				, Qnt.CrimesAgainstPersonsQnt
				, Qnt.CrimesAgainstProperty
				, Qnt.CrimesAgainstPropertyQnt
				, Qnt.SingleFamilyBPAdditions
				, Qnt.SingleFamilyBPAdditionsQnt
				, AVG(CAST(LBP.mktval AS INT)) AS MarketValue
				, AVG(CAST(LBP.sqft AS INT)) AS Sqft
			FROM landbankprops LBP, $quintiles_query AS Qnt
			WHERE (1 = 1) 
			$where_condition
			GROUP BY Qnt.AbsenteeOwnerShares, Qnt.AbsenteeOwnerSharesQnt
				, Qnt.AverageAssessedValue, Qnt.AverageAssessedValueQnt
				, Qnt.StreetVisible311Calls, Qnt.StreetVisible311CallsQnt
				, Qnt.StreetVisiblePropertyViolations, Qnt.StreetVisiblePropertyViolationsQnt
				, Qnt.CrimesAgainstPersons, Qnt.CrimesAgainstPersonsQnt
				, Qnt.CrimesAgainstProperty, Qnt.CrimesAgainstPropertyQnt
				, Qnt.SingleFamilyBPAdditions, Qnt.SingleFamilyBPAdditionsQnt
		";
		
		$conn = get_postgresql_db_connection('postgres');

		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		$area_stats = null;
		
		while ($row = pg_fetch_row($result)) {
			
			// Add basic data for all searches
			$area_stats = array(
				  'SoldPropertyCount' => number_format($row[0], 0, '.', ',')
				, 'UnsoldPropertyCount' => number_format($row[1], 0, '.', ',')
				, 'AbsenteeOwnerShares' => number_format($row[2], 2, '.', ',')
				, 'AbsenteeOwnerSharesQnt' => number_format($row[3], 2, '.', ',')
				, 'AverageAssessedValue' => number_format($row[4], 2, '.', ',')
				, 'AverageAssessedValueQnt' => number_format($row[5], 2, '.', ',')
				, 'StreetVisible311Calls' => number_format($row[6], 2, '.', ',')
				, 'StreetVisible311CallsQnt' => number_format($row[7], 2, '.', ',')
				, 'StreetVisiblePropertyViolations' => number_format($row[8], 2, '.', ',')
				, 'StreetVisiblePropertyViolationsQnt' => number_format($row[9], 2, '.', ',')
				, 'CrimesAgainstPersons' => number_format($row[10], 2, '.', ',')
				, 'CrimesAgainstPersonsQnt' => number_format($row[11], 2, '.', ',')
				, 'CrimesAgainstProperty' => number_format($row[12], 2, '.', ',')
				, 'CrimesAgainstPropertyQnt' => number_format($row[13], 2, '.', ',')
				, 'SingleFamilyBPAdditions' => number_format($row[14], 2, '.', ',')
				, 'SingleFamilyBPAdditionsQnt' => number_format($row[15], 2, '.', ',')
			);
			
			// Add additonal data only for registered users
			if (isset($_SESSION['Username'])) {
				$area_stats['MarketValue'] = number_format($row[16], 0, '.', ',');
				$area_stats['Sqft'] = number_format($row[17], 0, '.', ',');
			}
		}
		
		pg_close($conn);
		
		echo json_encode($area_stats);	
	}
	
	// get_area_statistics_by_neighborhood - Gathers a number of statistics from a neighborhood area
	function get_area_statistics_by_neighborhood ($neighborhood = null) {
		
		$neighborhood = (isset($neighborhood)) ? $neighborhood : (isset($_REQUEST['Neighborhood']) ? pg_escape_string($_REQUEST['Neighborhood']) : null);

		$query = "
			SELECT 
				  N.absshnum
				, AVG(CAST(abs_qr_des AS FLOAT)) AS abs_qr_des
				, AVG(CAST(avgassval AS FLOAT)) AS avgassval
				, AVG(CAST(avgav_qrd AS FLOAT)) AS avgav_qrd
				, N.visible
				, AVG(CAST(viz3_qra AS FLOAT)) AS viz3_qra
				, N.pvvis
				, AVG(CAST(pvis_qra AS FLOAT)) AS pvis_qra
				, N.crperson
				, AVG(CAST(crper_qra AS FLOAT)) AS crper_qra
				, N.crprop
				, AVG(CAST(cprop_qra AS FLOAT)) AS cprop_qra
				, N.add1f
				, AVG(CAST(bpa1f_qra AS FLOAT)) AS bpa1f_qra
				, (SELECT 
						COUNT(*) 
					FROM landbankprops LBP 
					WHERE ST_Intersects(LBP.geom, (SELECT 
							geom 
						FROM public.v2vneighborhood _N 
						WHERE (_N.neighshape ILIKE '%$neighborhood%')))
					AND	(LBP.sold_avail ILIKE 'disp%')) AS SoldPropertyCount
				, (SELECT 
						COUNT(*) 
					FROM landbankprops LBP 
					WHERE ST_Intersects(LBP.geom, (SELECT 
							geom 
						FROM public.v2vneighborhood _N 
						WHERE (_N.neighshape ILIKE '%$neighborhood%')))
					AND	(LBP.sold_avail ILIKE 'unsold%')) AS UnsoldPropertyCount
				, (SELECT 
						AVG(CAST(LBP.mktval AS INT))
					FROM landbankprops LBP 
					WHERE ST_Intersects(LBP.geom, (SELECT 
							geom 
						FROM public.v2vneighborhood _N 
						WHERE (_N.neighshape ILIKE '%$neighborhood%')))
					AND	(LBP.sold_avail ILIKE 'unsold%')) AS MarketValue
				, (SELECT 
						AVG(CAST(LBP.sqft AS INT))
					FROM landbankprops LBP 
					WHERE ST_Intersects(LBP.geom, (SELECT 
							geom 
						FROM public.v2vneighborhood _N 
						WHERE (_N.neighshape ILIKE '%$neighborhood%')))
					AND	(LBP.sold_avail ILIKE 'unsold%')) AS Sqft
			FROM public.quintilecityblock Q
			LEFT OUTER JOIN (SELECT 
					  COALESCE(CAST(_N.absshnum AS FLOAT), 0) AS absshnum
					, COALESCE(CAST(_N.visible AS FLOAT), 0) AS visible
					, COALESCE(CAST(_N.pvvis AS FLOAT), 0) AS pvvis
					, COALESCE(CAST(_N.crperson AS FLOAT), 0) AS crperson
					, COALESCE(CAST(_N.crprop AS FLOAT), 0) AS crprop
					, COALESCE(CAST(_N.add1f AS FLOAT), 0) AS add1f
				FROM public.v2vneighborhood _N
				WHERE (_N.neighshape ILIKE '%$neighborhood%')
			) N ON (1 = 1)
			WHERE ST_Intersects(Q.geom, (SELECT 
				geom 
				FROM public.v2vneighborhood N 
				WHERE (neighshape ILIKE '%$neighborhood%')))
			GROUP BY N.absshnum, N.visible, N.pvvis, N.crperson, N.crprop, N.add1f
			LIMIT 1 
		";
		
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		$area_stats = null;
		
		$row = pg_fetch_row($result);
		$area_stats = array(
			  'AbsenteeOwnerShares' => number_format($row[0], 2, '.', ',')
			, 'AbsenteeOwnerSharesQnt' => number_format($row[1], 2, '.', ',')
			, 'AverageAssessedValue' => number_format($row[2], 0, '.', ',')
			, 'AverageAssessedValueQnt' => number_format($row[3], 2, '.', ',')
			, 'StreetVisible311Calls' => number_format($row[4], 0, '.', ',')
			, 'StreetVisible311CallsQnt' => number_format($row[5], 2, '.', ',')
			, 'StreetVisiblePropertyViolations' => number_format($row[6], 0, '.', ',')
			, 'StreetVisiblePropertyViolationsQnt' => number_format($row[7], 2, '.', ',')
			, 'CrimesAgainstPersons' => number_format($row[8], 0, '.', ',')
			, 'CrimesAgainstPersonsQnt' => number_format($row[9], 2, '.', ',')
			, 'CrimesAgainstProperty' => number_format($row[10], 0, '.', ',')
			, 'CrimesAgainstPropertyQnt' => number_format($row[11], 2, '.', ',')
			, 'SingleFamilyBPAdditions' => number_format($row[12], 0, '.', ',')
			, 'SingleFamilyBPAdditionsQnt' => number_format($row[13], 2, '.', ',')
			, 'SoldPropertyCount' => number_format($row[14], 0, '.', ',')
			, 'UnsoldPropertyCount' => number_format($row[15], 0, '.', ',')
		);
		
		// Add additonal data only for registered users
		if (isset($_SESSION['Username'])) {
			$area_stats['MarketValue'] = number_format($row[16], 0, '.', ',');
			$area_stats['Sqft'] = number_format($row[17], 0, '.', ',');
		}
		
		pg_close($conn);
		
		echo json_encode($area_stats);	
	}
	
	// get_area_statistics_by_zip_code - Gathers a number of statistics from a zip code area
	function get_area_statistics_by_zip_code ($zip_code = null) {
		
		$zip_code = (isset($zip_code)) ? $zip_code : (isset($_REQUEST['Zip']) ? pg_escape_string($_REQUEST['Zip']) : null);
		$zip_code = preg_replace("/[^0-9\.\-]/", "", $zip_code);
		
		$query = "
			SELECT 
				  N.absshnum
				, AVG(CAST(abs_qr_des AS FLOAT)) AS abs_qr_des
				, AVG(CAST(avgassval AS FLOAT)) AS avgassval
				, AVG(CAST(avgav_qrd AS FLOAT)) AS avgav_qrd
				, N.visible
				, AVG(CAST(viz3_qra AS FLOAT)) AS viz3_qra
				, N.pvvis
				, AVG(CAST(pvis_qra AS FLOAT)) AS pvis_qra
				, N.crperson
				, AVG(CAST(crper_qra AS FLOAT)) AS crper_qra
				, N.crprop
				, AVG(CAST(cprop_qra AS FLOAT)) AS cprop_qra
				, N.add1f
				, AVG(CAST(bpa1f_qra AS FLOAT)) AS bpa1f_qra
				, (SELECT 
						COUNT(*) 
					FROM landbankprops LBP 
					WHERE ST_Intersects(LBP.geom, (SELECT 
							geom 
						FROM public.v2vzipcode _Z 
						WHERE (_Z.zipcode ILIKE '$zip_code')))
					AND	(LBP.sold_avail ILIKE 'disp%')) AS SoldPropertyCount
				, (SELECT 
						COUNT(*) 
					FROM landbankprops LBP 
					WHERE ST_Intersects(LBP.geom, (SELECT 
							geom 
						FROM public.v2vzipcode _Z 
						WHERE (_Z.zipcode ILIKE '$zip_code')))
					AND	(LBP.sold_avail ILIKE 'unsold%')) AS UnsoldPropertyCount
				, (SELECT 
						AVG(CAST(LBP.mktval AS INT))
					FROM landbankprops LBP 
					WHERE ST_Intersects(LBP.geom, (SELECT 
							geom 
						FROM public.v2vzipcode _Z 
						WHERE (_Z.zipcode ILIKE '$zip_code')))
					AND	(LBP.sold_avail ILIKE 'unsold%')) AS MarketValue
				, (SELECT 
						AVG(CAST(LBP.sqft AS INT))
					FROM landbankprops LBP 
					WHERE ST_Intersects(LBP.geom, (SELECT 
							geom 
						FROM public.v2vzipcode _Z 
						WHERE (_Z.zipcode ILIKE '$zip_code')))
					AND	(LBP.sold_avail ILIKE 'unsold%')) AS Sqft
			FROM public.quintilecityblock Q
			LEFT OUTER JOIN (SELECT 
					  COALESCE(CAST(_Z.absshnum AS FLOAT), 0) AS absshnum
					, COALESCE(CAST(_Z.visible AS FLOAT), 0) AS visible
					, COALESCE(CAST(_Z.pvvis AS FLOAT), 0) AS pvvis
					, COALESCE(CAST(_Z.crperson AS FLOAT), 0) AS crperson
					, COALESCE(CAST(_Z.crprop AS FLOAT), 0) AS crprop
					, COALESCE(CAST(_Z.add1f AS FLOAT), 0) AS add1f
				FROM public.v2vzipcode _Z
				WHERE (_Z.zipcode ILIKE '$zip_code')
			) N ON (1 = 1)
			WHERE ST_Intersects(Q.geom, (SELECT 
				geom 
				FROM public.v2vzipcode Z
				WHERE (Z.zipcode ILIKE '$zip_code')))
			GROUP BY N.absshnum, N.visible, N.pvvis, N.crperson, N.crprop, N.add1f
			LIMIT 1 
		";
		
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		$area_stats = null;
		
		$row = pg_fetch_row($result);
		$area_stats = array(
			  'AbsenteeOwnerShares' => number_format($row[0], 2, '.', ',')
			, 'AbsenteeOwnerSharesQnt' => number_format($row[1], 2, '.', ',')
			, 'AverageAssessedValue' => number_format($row[2], 0, '.', ',')
			, 'AverageAssessedValueQnt' => number_format($row[3], 2, '.', ',')
			, 'StreetVisible311Calls' => number_format($row[4], 0, '.', ',')
			, 'StreetVisible311CallsQnt' => number_format($row[5], 2, '.', ',')
			, 'StreetVisiblePropertyViolations' => number_format($row[6], 0, '.', ',')
			, 'StreetVisiblePropertyViolationsQnt' => number_format($row[7], 2, '.', ',')
			, 'CrimesAgainstPersons' => number_format($row[8], 0, '.', ',')
			, 'CrimesAgainstPersonsQnt' => number_format($row[9], 2, '.', ',')
			, 'CrimesAgainstProperty' => number_format($row[10], 0, '.', ',')
			, 'CrimesAgainstPropertyQnt' => number_format($row[11], 2, '.', ',')
			, 'SingleFamilyBPAdditions' => number_format($row[12], 0, '.', ',')
			, 'SingleFamilyBPAdditionsQnt' => number_format($row[13], 2, '.', ',')
			, 'SoldPropertyCount' => number_format($row[14], 0, '.', ',')
			, 'UnsoldPropertyCount' => number_format($row[15], 0, '.', ',')
		);
		
		// Add additonal data only for registered users
		if (isset($_SESSION['Username'])) {
			$area_stats['MarketValue'] = number_format($row[16], 0, '.', ',');
			$area_stats['Sqft'] = number_format($row[17], 0, '.', ',');
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
				, address
				, sold_avail
				, condition
				, mktval
			FROM public.landbankprops
		";
		
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		$properties = array();
		
		while ($row = pg_fetch_row($result)) {
			
			$sold_avail = (strtolower($row[4]) == 'disp') ? 'Sold' : ucwords(strtolower($row[4]));
			
			$properties[] = array(
				  'PropertyId' => $row[0]
				, 'Lat' => 	$row[1]
				, 'Lng' => 	$row[2]
				, 'Address' => 	$row[3]
				, 'SoldAvail' => $sold_avail
				, 'Condition' => $row[5]
				, 'MarketValue' => number_format($row[6], 0, '.', ',')
			);
		}
		
		pg_close($conn);
		
		echo json_encode($properties);	
	}
	
	// get_property_details - Gets all relevant info for a single property
	function get_property_details ($propertyId = null) {

		$propertyId = (isset($propertyId)) ? $propertyId : (isset($_REQUEST['PropertyId']) ? pg_escape_string($_REQUEST['PropertyId']) : null);
	
		$query = "
			SELECT
				  gid
				, address
				, apn
				, neigh
				, zip
				, yearacq
				, yearsold
				, propclass
				, sold_avail
				, condition
				, mktval
				, sqft
				, lat
				, lon
			FROM public.landbankprops
			WHERE gid = $propertyId;
		";
			
		$conn = get_postgresql_db_connection('postgres');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
			
		$row = pg_fetch_row($result);
		
		$sold_avail = (strtolower($row[8]) == 'disp') ? 'Sold' : ucwords(strtolower($row[8]));
		
		$propertyDetails = array(
			  'Gid' => $row[0]
			, 'Address' => $row[1]
			, 'APN' => $row[2]
			, 'Neighborhood' => $row[3]
			, 'Zip' => $row[4]
			, 'YearAcq' => $row[5]
			, 'YearSold' => $row[6]
			, 'PropClass' => $row[7]
			, 'SoldAvail' => $sold_avail
			, 'Condition' => ucwords(strtolower($row[9]))
			, 'Mktval' => $row[10]
			, 'MktvalDisplay' => number_format($row[10], 0, '.', ',')
			, 'Sqft' => $row[11]
			, 'SqftDisplay' => number_format($row[11], 0, '.', ',')
			, 'Lat' => $row[12]
			, 'Lon' => $row[13]
		);	
		
		pg_close($conn);
		
		echo json_encode($propertyDetails);	
	}
	
	// get_full_property_detail - Gets all relevant info for a single property
	function get_full_property_details ($propertyId = null) {

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
			, 'MktvalDisplay' => number_format($row[31], 0, '.', ',')
			, 'Sqft' => $row[32]
			, 'SqftDisplay' => number_format($row[32], 0, '.', ',')
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
		
		global $data_conn;
		
		$pgdbconn = pg_connect(
			" host=" . $data_conn->host . 
			" port=" . $data_conn->port .
			" dbname=" . $db_name . 
			" user=" . $data_conn->user . 
			" password=" . $data_conn->password
		) or die ('An error occurred.\n');
		
		return $pgdbconn;
	}

?>
