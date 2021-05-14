#!/usr/local/bin/node
'use strict';


//START OF moduleFunction() ============================================================

const moduleFunction = function(args={}) {
	return (`./lib/demo-module says: ${new Date().toLocaleTimeString()}`);
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction()

