<?php

	require_once('conn.php');

	if (! session_id()) session_start();
	
	if (! isset($dbh)) $dbh = new PDO("pgsql:" .
		"dbname=" . $auth_conn->db_name . 
		";host=" . $auth_conn->host, 
		$auth_conn->user, 
		$auth_conn->password
	);
	
	header('Access-Control-Allow-Headers: Content-Type');
	header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
	header('Access-Control-Allow-Origin: *');
	//header('Content-type: application/json', true);
	
	// Get action requested
	if (! isset($_REQUEST['Action'])) die();
	
	switch ($_REQUEST['Action'])
	{	
		// POST methods
		case 'ActivateUser': activate_user(); break;
		case 'CreateUser': create_user(); break;
		case 'GetUserDetails': get_user_details(); break;
		case 'GetUserFavorites': get_user_favorites(); break;
		case 'SetUserFavorite': set_user_favorite(); break;
		case 'LoginUser': login_user(); break;
		case 'LogoutUser': logout_user(); break;
	}
	
	// create_user - Registers a new user after the required fields have been provided
	function create_user () {
	
		require_once(dirname(__FILE__)."/PHPAuth/Config.php");
		require_once(dirname(__FILE__)."/PHPAuth/Auth.php");

		global $dbh;
	
		$config = new PHPAuth\Config($dbh);
		$auth   = new PHPAuth\Auth($dbh, $config);
		
		$auth_data = (object) [
			'password' => (isset($_POST['CreatePassword']) ? $_POST['CreatePassword'] : null),
			'repeat_password' => (isset($_POST['CreateRepeatPassword']) ? $_POST['CreateRepeatPassword'] : null),
			'email_address' => (isset($_POST['CreateEmailAddress']) ? $_POST['CreateEmailAddress'] : null),
			'purchased_before' => (isset($_POST['CreatePurchasedBefore']) ? $_POST['CreatePurchasedBefore'] : null),
			'gender' => (isset($_POST['CreateGender']) ? $_POST['CreateGender'] : null),
			'age' => (isset($_POST['CreateAge']) ? $_POST['CreateAge'] : null),
			'zip' => (isset($_POST['CreateZip']) ? $_POST['CreateZip'] : null),
			'account_type' => 'user'
		];
	
		// Set additional create user parameters
		$params = array(
			'purchased_before' => $auth_data->purchased_before,
			'gender' => $auth_data->gender,
			'age' => $auth_data->age,
			'zip' => $auth_data->zip 
		);
	
		sleep(2); // Wait to prevent too many requests
	
		$register = $auth->register(
			$auth_data->email_address, 
			$auth_data->password, 
			$auth_data->repeat_password, 
			$auth_data->account_type, 
			$params, null, true);
		
		$message = '';
		if (isset($register['error']) && ($register['error'] == 1)) {
			$message = $register['message'];
			$is_error = true;
		} else {
			// Registration was successful
			$message = $register['message'];
		}
		
		echo $message;
	}
	
	// activate_user - Activates a user that has been emailed an activation key after registering
	function activate_user () {
	
		require_once(dirname(__FILE__)."/PHPAuth/Config.php");
		require_once(dirname(__FILE__)."/PHPAuth/Auth.php");
	
		global $dbh;
	
		$config = new PHPAuth\Config($dbh);
		$auth   = new PHPAuth\Auth($dbh, $config);

		$auth_data = (object) [
			'activation_key' => (isset($_POST['ActivationKey']) ? $_POST['ActivationKey'] : null)
		];
	
		sleep(2); // Wait to prevent too many requests
	
		$activation = $auth->activate($auth_data->activation_key);
		
		$message = '';
		if (isset($activation['error']) && ($activation['error'] == 1)) {
			$message = $activation['message'];
			$is_error = true;
		} else {
			$message = 'Activation Successful';
			// Activation was successful
			//header('Location: main.php');
		}
		
		echo $message;
	}
	
	// login_user - Authenticates a user that provides a username and password
	function login_user () {

		require_once(dirname(__FILE__)."/PHPAuth/Config.php");
		require_once(dirname(__FILE__)."/PHPAuth/Auth.php");
	
		global $dbh;

		$config = new PHPAuth\Config($dbh);
		$auth   = new PHPAuth\Auth($dbh, $config);

		$auth_data = (object) [
			'emailaddress' => (isset($_POST['LoginEmailAddress']) ? $_POST['LoginEmailAddress'] : null),
			'password' => (isset($_POST['LoginPassword']) ? $_POST['LoginPassword'] : null),
			'remember_me' => (isset($_POST['LoginRememberMe']) ? $_POST['LoginRememberMe'] : null)
		];
	
		$login = $auth->login($auth_data->emailaddress, $auth_data->password, $auth_data->remember_me);
		
		$message = '';
		if (isset($login['error']) && ($login['error'] == 1)) {
			http_response_code(400);
			$message = 'Error: ' . $login['message'];
			$is_error = true;
		} else {
			// Login was successful
			$message = 'Login Successful';
			$_SESSION['Username'] = $auth_data->emailaddress;
			//header('Location: main.php'); 
		}
		
		echo $message;
	}
	
	// logout_user - Logs out the current user
	function logout_user () {
		
		unset($_SESSION['Username']);
	}
	
	// get_user_details - Gets all relevant info about the currently logged in user
	function get_user_details () {

		$query = "
			SELECT 
				  id
				, email
				, isactive
				, account_type
				, purchased_before
				, gender
				, age
				, zip
			FROM public.users
			WHERE (1 = 1)
			AND (email ILIKE '" . $_SESSION['Username'] . "')
		";
			
		$conn = get_postgresql_db_connection('v2v_auth');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');

		$row = pg_fetch_row($result);
		$userDetails = array(
			  'Id' => $row[0]
			, 'Email' => $row[1]
			, 'IsActive' => $row[2]
			, 'AccountType' => $row[3]
			, 'PurchasedBefore' => $row[4]
			, 'Gender' => $row[5]
			, 'Age' => $row[6]
			, 'Zip' => $row[7]
		);
		
		pg_close($conn);
		
		echo json_encode($userDetails);
	}
	
	// get_user_favorites - Retrieves the current user's favorite searches
	function get_user_favorites () {
		
		$query = "
			SELECT 
				  UF.id
				, UF.search_text
			FROM public.user_favorites UF
			LEFT OUTER JOIN public.users U ON UF.user_id = U.id
			WHERE (1 = 1)
			AND (U.email ILIKE '" . $_SESSION['Username'] . "')
		";
			
		$conn = get_postgresql_db_connection('v2v_auth');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');

		$user_favorites = array();
		
		while ($row = pg_fetch_row($result)) {
			$user_favorites[] = array(
				  'Id' => $row[0]
				, 'SearchText' => $row[1]
			);
		}
		
		pg_close($conn);
		
		echo json_encode($user_favorites);
	}
	
	// set_user_favorite - Sets a new user favorite
	function set_user_favorite () {
		
		$search_text = (isset($search_text)) ? $search_text : (isset($_REQUEST['SearchText']) ? 
			pg_escape_string($_REQUEST['SearchText']) : null);
		
		$query = "
			DELETE FROM public.user_favorites WHERE id IN (SELECT 
				  UF.id
			FROM public.user_favorites UF
			LEFT OUTER JOIN public.users U ON UF.user_id = U.id
			WHERE (1 = 1)
			AND (U.email ILIKE '" . $_SESSION['Username'] . "')
			AND ((SELECT COUNT(*) FROM public.user_favorites UF WHERE UF.user_id = U.id) >= 5)   
			ORDER BY created_date ASC
			LIMIT 1);
			
			INSERT INTO public.user_favorites (user_id, search_text, created_date) 
			VALUES (
				(SELECT id FROM users WHERE email ILIKE '" . $_SESSION['Username'] . "'),
				'$search_text',
				now()
			)
		";
		
		$conn = get_postgresql_db_connection('v2v_auth');
		
		$result = pg_query($conn, $query) 
			or die ('Error: ' + pg_last_error($conn) + '\n');
		
		pg_close($conn);
		
		echo json_encode(true);
	}
	
	function get_postgresql_db_connection ($db_name='v2v_auth') {
		
		global $auth_conn;
		
		$pgdbconn = pg_connect(
			" host=" . $auth_conn->host . 
			" port=" . $auth_conn->port .
			" dbname=" . $db_name . 
			" user=" . $auth_conn->user . 
			" password=" . $auth_conn->password
		) or die ('An error occurred.\n');
		
		return $pgdbconn;
	}
	
?>
	