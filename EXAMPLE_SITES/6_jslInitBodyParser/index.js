#!/usr/local/bin/node
'use strict';

//START OF moduleFunction() ============================================================

const moduleFunction = function(req, res, jslScope) {
	const { configuration, expressjs, refreshRequire } = jslScope;
	const { app, next } = expressjs;

	const body=req.body; //NOTE: jsl-init added body-parser to expressjs
	
	body.HELLO="Proof that post body exists"
	
	res.send(body);
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;

