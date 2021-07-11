js={};
js.ajax = new rad.ajax();

pageLoaded=function(){
	console.log("Everything is loaded");
}

loadOverlayPage=function(page){
	//alert(page);
	js.ajax.get(
		"ajax.php",
		"q=get_page&page="+page,
		function(lamda){
			//alert(lamda);
			data = JSON.parse(lamda);
			alert(data.html);
		}
	);
}