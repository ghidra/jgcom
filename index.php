<?php
include_once('header.php');

$rt_array = array(
	"work/seesound.php", 
	"work/uproar.php",
	"work/savage.php",
	"work/aicp.php",
	"work/nikejoyride.php",
	"work/balenciaga.php",
	"work/humanrace.php",
	"work/gatorade.php"
);
//missing sould cycle
//missing watchman
//missing tonandi
//

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
//

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

foreach ($rt_array as $v)
{
	//echo video_entry($v[0],$v[1],$v[2]);
	include_once($v);
	echo video_entry($payload,$v);
}

//echo '</div>';


//echo '<h2>VFX</h2>';

//echo '<div class="grid-container">';

foreach ($vfx_array as $v)
{
	//echo video_entry($v[0],$v[1],$v[2]);
	//include_once($v);
	include_once($v);
	echo video_entry($payload,$v);
}

echo '</div>';

include('footer.php');
?>
