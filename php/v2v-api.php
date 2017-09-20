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
	
	// get_properties - Gets map display property
	function get_map_properties () {
		
		$query = "
			SELECT
				  gid
				, lat
				, lon
			FROM public.landbankprops
			ORDER BY zoned
			LIMIT 1000
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
			);
		}
		
		pg_close($conn);
		
		echo json_encode($properties);	
	}
	
	// get_property_detail - Gets all relevant info for a single property
	function get_property_details ($propertyId = null) {

		$propertyId = (isset($propertyId)) ? $propertyId : (isset($_REQUEST['PropertyId']) ? $_REQUEST['PropertyId'] : null);
	
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
			, 'Propclass' => $row[16]
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
			, 'Sqft' => $row[32]
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
