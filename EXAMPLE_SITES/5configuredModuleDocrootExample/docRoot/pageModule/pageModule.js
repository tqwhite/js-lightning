#!/usr/local/bin/node
'use strict';
const qt = require('qtools-functional-library');

//START OF moduleFunction() ============================================================

const moduleFunction = function(req, res, jslObject) {
	const demoPageName = 'index.html';


	

	const output = `
HELLO: ${new Date().toLocaleString()}
from: ${req.path} in ${__filename}
feel free to try: ${req.protocol}://${req.host}/${demoPageName}
`;
	
	res.send(output);
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction

