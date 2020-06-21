<?php

if ( isset($_GET['q'])  )
{
	$q = $_GET['q'];

	if($q=='get_page')
	{
		echo json_encode("something");
		//echo json_encode(include_once($_GET['page']));
	}
}

?>