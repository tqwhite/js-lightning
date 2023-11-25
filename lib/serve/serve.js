#!/usr/local/bin/node
'use strict';

const qt = require('qtools-functional-library');
//console.dir(qt.help());

const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const bodyParser = require('body-parser');

//START OF moduleFunction() ============================================================

const moduleFunction = function(args = {}) {
	const { userConfiguration } = args;
	const {
		siteDirectory,
		port,
		noServe,
		docRootPath,
		versionInfo
	} = userConfiguration;
	
	const moduleConfig = userConfiguration.getModuleConfig(__filename);

	const findDynamicPage = require('./lib/find-dynamic-page')({
		userConfiguration
	});

	// ---------------------------------------------------------------------
	// UTILITY FUNCTIONS
	
	const refreshRequire = (requestedModulePath, options = {}) => {
		const callingFilePath = new Error().stack
			.split(/\n/)[2]
			.trim()
			.match(/(\/.*?):.*/)[1];

		const callingDirName = path.dirname(callingFilePath);
		const remappedModulePath = path.join(callingDirName, requestedModulePath);

		if (!options.noRefreshNormalRequire) {
			delete require.cache[require.resolve(remappedModulePath)];
		}

		return require(remappedModulePath);
	};

	const jslScope = {
		configuration: userConfiguration,
		expressjs: { app },
		refreshRequire
	};
	
	const jslInitPath = path.join(siteDirectory, 'jsl-init');

	if (fs.existsSync(jslInitPath)) {
		try {
			require(jslInitPath)({ jslScope });
		} catch (e) {
			console.dir({ ['e']: e }, { showHidden: false, depth: 4, colors: true });
			console.error(`INITIALIZATION ERROR - EXITING`);

			process.exit(1);
		}
	} else if (fs.existsSync(`${jslInitPath}.js`)) {
		try {
			require(`${jslInitPath}.js`)({ jslScope });
		} catch (e) {
			console.dir({ ['e']: e }, { showHidden: false, depth: 4, colors: true });
			console.error(`INITIALIZATION ERROR - EXITING`);

			process.exit(1);
		}
	}
	
	if (userConfiguration.verbose) {
		console.dir(
			{ ['userConfiguration']: userConfiguration },
			{ showHidden: false, depth: 6, colors: true }
		);
	}
	
	Object.freeze(jslScope);
	
	// ---------------------------------------------------------------------
	// ASSSEMBLE EXPRESS APP
	
	app.use(function(req, res, next) {
		res.removeHeader('X-Powered-By');
		res.setHeader(
			'for-javascript-lovers',
			'https://www.npmjs.com/package/js-lightning'
		);
		next();
	});
	
	app.use(function(req, res, next) {
		if (userConfiguration.verbose) {
			console.log(
				`\n${req.method} request: ${req.host}${req.path}${
					Object.keys(req.query).length
						? '?' +
							Object.keys(req.query)
								.map(
									key =>
										encodeURIComponent(key) +
										'=' +
										encodeURIComponent(req.query[key])
								)
								.join('&')
						: ''
				}`
			);
		}

		if (req.path.match(/jsl-init/) || req.path.match(/\/lib\//)) {
			qt.log(`rejecting request: ${req.path}`, { noSuffix: true });
			res.status(404);
			res.send(`404 Not Found`);
			return;
		}

		findDynamicPage.get(req, (err, requestedModulePath) => {
			if (requestedModulePath) {
				delete require.cache[require.resolve(requestedModulePath)]; //kill cache

				jslScope.expressjs.next = next;
				jslScope.expressjs.app = app;
				jslScope.expressjs.req = req;
				jslScope.expressjs.res = res;

				try {
					require(requestedModulePath)(req, res, jslScope);
				} catch (e) {
					res.status(500);

					if (
						moduleConfig.qtGetSurePath('revealErrorMessageToBrowser', false)
					) {
						res.setHeader('reason', `bad module ${escape(req.path)}`);
						res.send(`FATAL ERROR: ${escape(req.path)} ${e.toString()}`);
					} else {
						res.setHeader('reason', `bad module`);
						res.send(`FATAL ERROR: internal server error`);
					}
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
		qt.log(`siteDirectory: ${siteDirectory}`, { noSuffix: true });
		qt.log(`docRootPath: ${docRootPath}`, { noSuffix: true });
		qt.log(
			`Magic happens on port ${port} using ${versionInfo.name} Version ${
				versionInfo.version
			}\n`,
			{ noSuffix: true }
		);
	});
};

//END OF moduleFunction() ============================================================

module.exports = args => new moduleFunction(args);

