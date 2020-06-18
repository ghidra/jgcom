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
	"work/cokefootprints.php",
	"work/bingle.php",
	"work/peta.php",
	"work/beyonce.php"
);

echo '<h2>Realtime</h2>';

echo '<div class="grid-container">';

foreach ($rt_array as $v)
{
	echo '<div class="grid-item">';
	include_once($v);
	echo '</div>';
}

echo '</div>';
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

echo '<h2>VFX</h2>';

echo '<div class="grid-container">';

foreach ($vfx_array as $v)
{
	echo '<div class="grid-item">';
	include_once($v);
	echo '</div>';
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
