#!/usr/local/bin/node
'use strict';

const qt = require('qtools-functional-library');
//console.dir(qt.help());

const express = require('express');
const app = express();

//START OF moduleFunction() ============================================================

const moduleFunction = function(args = {}) {
	const { userConfiguration } = args;
	const { siteDirectory, port, noServe, docRootPath } = userConfiguration;
	const findDynamicPage = require('./lib/find-dynamic-page')({
		userConfiguration
	});

	app.use(function(req, res, next) {
		res.removeHeader('X-Powered-By');
		res.setHeader('for-javascript-lovers', 'https://www.npmjs.com/package/js-lightning');
		next();
	});
	
	app.use(function(req, res, next) {
		findDynamicPage.get(req, (err, requestedModulePath) => {
			if (requestedModulePath) {
				qt.log(`serving dynamic: ${requestedModulePath}`, { noSuffix: true });
				delete require.cache[require.resolve(requestedModulePath)]; //kill cache
				try {
					require(requestedModulePath)({ req, res, userConfiguration }, next);
				} catch (e) {
					res.status(500);
					res.setHeader('reason', `bad module ${req.path}`);
					res.send(`FATAL ERROR: ${req.path} ${e.toString()}`);
				}
			} else {
				next();
			}
		});

		return;
		//next()
	});

	app.use(function(req, res, next) {
		qt.log(`trying static: ${docRootPath}/${req.path}`, { noSuffix: true });
		next();
	});

	app.use(express.static(docRootPath));

	if (noServe) {
		qt.log(`siteDirectory: ${siteDirectory}`, { noSuffix: true });
		qt.log(`docRootPath: ${docRootPath}`, { noSuffix: true });
		qt.log(`WARNING: noServe==true, exiting`, { noSuffix: true });
		process.exit();
	}
	
	app.listen(port, () => {
		qt.log(`Magic happens on port ${port}`, { noSuffix: true });
		qt.log(`siteDirectory: ${siteDirectory}`, { noSuffix: true });
		qt.log(`docRootPath: ${docRootPath}`, { noSuffix: true });
	});
};

//END OF moduleFunction() ============================================================
qt.log(
	`INIT: SYSTEM STARTUP ${new Date().toLocaleString()} ===============================`,
	{ noSuffix: true }
);
module.exports = args => new moduleFunction(args);

