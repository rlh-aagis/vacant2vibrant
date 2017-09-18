
$(document).ready(function () {
	
	$('#divNavbar').load('templates/navbar.html');
	
	$('#divSidebar').load('templates/sidebar.html', function( response, status, xhr ) { 
		$('#divSideBarMenuToggle').click(function (e) {
			e.preventDefault();
			$("#divSidebar").toggleClass('active');
		});
	});
	
	initMap('divMap');
});
