<?php

if ( isset($_GET['q'])  )
{
	$q = $_GET['q'];

	if($q=='get_page')
	{
		// only plain names from work/; never include a path from the request
		$name = basename($_GET['page'] ?? '', '.php');
		$file = __DIR__ . "/work/$name.php";
		if (preg_match('/^[a-z0-9_-]+$/i', $name) && is_file($file))
		{
			include_once($file);
			echo json_encode($payload);
		}
	}
}

?>
