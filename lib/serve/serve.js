#!/usr/local/bin/node
'use strict';
console.dir(require.resolve('qtools-functional-library'));
const qt = require('qtools-functional-library');
//console.dir(qt.help());

const express = require('express');
const app = express();

//START OF moduleFunction() ============================================================

const moduleFunction = function(args = {}) {
	const { userConfiguration } = args;
	const { siteDirectory, port } = userConfiguration;
	const findDynamicPage = require('./lib/find-dynamic-page')({
		userConfiguration
	});

	app.use(function(req, res, next) {
		findDynamicPage.get(req, (err, requestedModulePath) => {
			if (requestedModulePath) {
				qt.log(`serving dynamic: ${requestedModulePath}`, {noSuffix:true});
				require(requestedModulePath)({req, res, userConfiguration}, next);
			} else {
				next();
			}
		});

		return;
		//next()
	});

	app.use(express.static(siteDirectory));

	app.listen(port, () => {
		qt.log(`Magic happens on port ${port}`, {noSuffix:true});
	});
};

//END OF moduleFunction() ============================================================
qt.log(`INIT: SYSTEM STARTUP ${new Date().toLocaleString()} ===============================`, {noSuffix:true});
module.exports = args => new moduleFunction(args);

