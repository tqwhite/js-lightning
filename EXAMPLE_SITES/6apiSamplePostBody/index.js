#!/usr/local/bin/node
'use strict';
const qt = require('qtools-functional-library');

//START OF moduleFunction() ============================================================

const moduleFunction = function(req, res, jslScope) {
	const body=req.body;
	body.HELLO="This is inserted into whatever you sent as a post body"
	
	res.send(body);
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;

