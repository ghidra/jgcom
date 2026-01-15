<?php
include_once('header.php');

$epic_array = array(
	"work/legofortniteninjago.php",
	"work/legofortniteexpedition.php",
	"work/legofortniteodyssey.php",
	"work/legofortnitelostisles.php",
	"work/legofortnite.php",
	"work/valley.php",
	"work/mustang.php",
	"work/hmi.php"
);

$rt_array = array(
	"work/seesound.php", 
	"work/uproar.php",
	"work/tonandi.php",
	"work/savage.php",
	"work/aicp.php",
	"work/nikejoyride.php",
	"work/balenciaga.php",
	"work/humanrace.php",
	"work/gatorade.php"
);
//missing sould cycle
//missing watchman

$vfx_array = array(
	"work/hennessypiccards.php", 
	"work/nikevapor.php",
	"work/yellow.php",
	"work/bagman.php",
	"work/cokefootprints.php",
	"work/bingle.php",
	"work/peta.php",
	"work/beyonce.php"
);
//missing direct tv
//missing att blooming communities

function video_entry($data,$page)
{
	return '<div class="grid-item">
	<div onclick="loadOverlayPage(\''.$page.'\')" class="clickable"><h4>'.$data->title.'</h4></div>
	<div class="grid-iframe">
	<iframe src="'.$data->video.'" frameborder="0" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
	</iframe>
	</div>
	<div class="desription">
	'.$data->description.'
	</div>
	</div>';
}

//echo '<h2>Realtime</h2>';

echo '<div class="grid-container">';
foreach ($epic_array as $v){
	include_once($v);
	echo video_entry($payload,$v);
}
foreach ($rt_array as $v){
	include_once($v);
	echo video_entry($payload,$v);
}

//echo '</div>';


//echo '<h2>VFX</h2>';

//echo '<div class="grid-container">';

foreach ($vfx_array as $v){
	include_once($v);
	echo video_entry($payload,$v);
}

echo '</div>';

include('footer.php');
?>
