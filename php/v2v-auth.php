<?php
	
	error_reporting(E_ALL | E_STRICT);
	ini_set('display_errors', 'On');
	
	header('Access-Control-Allow-Headers: Content-Type');
	header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
	header('Access-Control-Allow-Origin: *');
	//header('Content-type: application/json', true);
	
	// Get action requested
	if (! isset($_REQUEST['action'])) die();
	
	switch ($_REQUEST['action'])
	{
		// POST methods
		case 'CreateUser': create_user(); break;
	}
	
	function create_user() {
	
		require_once(dirname(__FILE__)."/PHPAuth/Config.php");
		require_once(dirname(__FILE__)."/PHPAuth/Auth.php");

		global $dbh;
		global $message;
	
		$config = new PHPAuth\Config($dbh);
		$auth   = new PHPAuth\Auth($dbh, $config);

		$auth_data = (object) [
			'username' => (isset($_POST['CreateUsername']) ? $_POST['CreateUsername'] : null),
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
	
		$register = $auth->register(
			$auth_data->email_address, 
			$auth_data->password, 
			$auth_data->repeat_password, 
			$auth_data->account_type, 
			$params, null, true);
		
		if (isset($register['error']) && ($register['error'] == 1)) {
			$message = $register['message'];
			$is_error = true;
		} else {
			// Registration was successful
			$message = $register['message'];
		}
	}
	
?>
	