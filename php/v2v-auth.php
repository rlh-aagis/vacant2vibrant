<?php

	if (!isset($_SESSION)) session_start();
	
	error_reporting(E_ALL | E_STRICT);
	ini_set('display_errors', 'On');
	
	if (! isset($dbh)) $dbh = new PDO("pgsql:dbname=v2v_auth;host=45.40.137.203", 'postgres', 'geo9126'); // AAGIS Dev Environment
	//if (! isset($dbh)) $dbh = new PDO("pgsql:dbname=v2v_auth;host=localhost", 'v2v_user', 'password'); 	// Local Dev Environment
	
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
			'gender' => (isset($_POST['CreateGender']) ? $_POST['CreateGender'] : null),
			'zip' => (isset($_POST['CreateZip']) ? $_POST['CreateZip'] : null),
			'account_type' => 'user'
		];
	
		// Set additional create user parameters
		$params = array(
			'gender' => $auth_data->gender,
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
			$_SESSION['Username'] = $auth_data->username;
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
				, gender
				, zip
			FROM public.users
			WHERE (1 = 1)
			AND (email ILIKE " . $_SESSION['Username'] . ")
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
			, 'Gender' => $row[4]
			, 'Zip' => $row[5]
		);
		
		pg_close($conn);
		
		echo json_encode($userDetails);	
	}
	
	function get_postgresql_db_connection ($db_name='v2v_auth') {
		
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
	