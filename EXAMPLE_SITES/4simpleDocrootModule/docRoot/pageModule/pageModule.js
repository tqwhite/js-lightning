module.exports=({req, res, userConfiguration})=>res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
	<META HTTP-EQUIV='Content-Type' CONTENT='text/html; charset=UTF-8'>
	
	<!-- META http-equiv="refresh" content="5;URL=http://somewhere.com" -->
	
	<title>Template Page Title</title>
	
	<script   src="staticAssets/forScriptTag.js"></script> 
	<!--link rel='stylesheet' type='text/css' href='css/main.css' /-->
	
	<style type='text/css'><!--
	
		body {
			color:#4B92D1;
			font-family:sans-serif;
		}
		
	--></style>
	
</head>
<body>

	Hello from 4simpleDocrootModule/docRoot/pageModule/pageModule.js (demonstrates accessing submodules)
	
	${new Date().toLocaleString()}
	
</body>

<script type='text/javascript'>
	/* <![CDATA[ */

	(callback => {
		if (document.readyState != 'loading') callback();
		else document.addEventListener('DOMContentLoaded', callback);
	})(() => {
		
		const body=document.getElementsByTagName('body');
		
		var element = document.createElement("div");
		element.style.color='green';
		element.style.margin='10px 0px 10px 0px';
		element.style.padding='10px 0px 10px 0px';
		element.style.borderTop='1pt solid blue';
		element.textContent='Thanks for visiting.';

		var element2 = document.createElement("div");
		element2.innerHTML="<div style='color:orange;'>Y'all come back now, hear!!</div>";

		document.body.appendChild(element);
		document.body.appendChild(element2);

	}); //immediate call, unnamed arrow function


	
	/* ]]> */
</script>

</html>

`);