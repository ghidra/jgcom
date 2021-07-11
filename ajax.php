<?php

if ( isset($_GET['q'])  )
{
	$q = $_GET['q'];

	if($q=='get_page')
	{
		//echo json_encode("something");
		include_once($_GET['page']);
		echo json_encode($payload);
	}
}

?>