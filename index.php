<?php
include_once('header.php');

$rt_array = array(
	array("SeeSound","https://www.youtube.com/embed/LIctf06yIDk","work/seesound.php"), 
	array("UPROAR","https://www.youtube.com/embed/6lDGAQUbTaw","work/uproar.php"),
	array("SavageXFenty","https://player.vimeo.com/video/378346698","work/savage.php"),
	array("AICP / NEXT titles 2018","https://www.youtube.com/embed/H8DlhHjgeJM","work/aicp.php"),
	array("Nike Joyride","https://player.vimeo.com/video/355403542","work/nikejoyride.php"),
	array("Balenciaga Summer 2019","https://www.youtube.com/embed/9xquwik2K5k","work/balenciaga.php"),
	array("The Human Race","https://www.youtube.com/embed/-PKejX4A7vg","work/humanrace.php"),
	array("Gatorade Beat the Blitz","https://www.youtube.com/embed/l-Z-2TJeX0o","work/gatorade.php")
);
//missing sould cycle
//missing watchman
//missing tonandi
//

$vfx_array = array(
	array("Hennessy The Piccards","https://www.youtube.com/embed/GEPCToxNXuQ","work/hennessypiccards.php"), 
	array("Nike Vapor","https://player.vimeo.com/video/217711664?title=0&byline=0&portrait=0","work/nikevapor.php"),
	array("Yellow","https://player.vimeo.com/video/209137860?color=ffffff&byline=0&portrait=0",""),
	array("Bagman","https://player.vimeo.com/video/108128386?badge=0",""),
	array("Coca-Cola Footprints","https://player.vimeo.com/video/181080719","work/cokefootprints.php"),
	array("Bingle","https://player.vimeo.com/video/125370829?color=ffffff&title=0&byline=0&portrait=0","work/bingle.php"),
	array("PETA 98%","https://www.youtube.com/embed/ylU58yZt9Vs","work/peta.php"),
	array("Beyonce Rise","https://www.youtube.com/embed/Fx0oFC9EUuE","work/beyonce.php")
);
//missing direct tv
//

function video_entry($title,$link,$page)
{
	return '<div class="grid-item">
	<h4>'.$title.'</h4>
	<div class="grid-iframe">
	<iframe src="'.$link.'" frameborder="0" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
	</iframe>
	</div>
	</div>';
}

//echo '<h2>Realtime</h2>';

echo '<div class="grid-container">';

foreach ($rt_array as $v)
{
	echo video_entry($v[0],$v[1],$v[2]);
	//include_once($v);
}

//echo '</div>';
/*
include_once('work/seesound.php');
include_once('work/uproar.php');
include_once('work/savage.php');
echo ' SoulCycle<br>';
include_once('work/aicp.php');
include_once('work/nikejoyride.php');
include_once('work/balenciaga.php');
include_once('work/humanrace.php');
include_once('work/gatorade.php');*/

//echo '<h2>VFX</h2>';

//echo '<div class="grid-container">';

foreach ($vfx_array as $v)
{
	echo video_entry($v[0],$v[1],$v[2]);
	//include_once($v);
}

echo '</div>';

/*include_once('work/hennessypiccards.php');
include_once('work/nikevapor.php');
include_once('work/cokefootprints.php');
include_once('work/bingle.php');
include_once('work/peta.php');
include_once('work/beyonce.php');*/

include('footer.php');
?>
