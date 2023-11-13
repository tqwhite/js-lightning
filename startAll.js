#!/usr/bin/env node
'use strict';

const qt = require('qtools-functional-library');
const path = require('path');
const fs = require('fs');

//START OF moduleFunction() ============================================================

const moduleFunction = function() {
	const userConfiguration = require('./lib/rationalize-configs-show-help-maybe-exit');

	const packageInfo = JSON.parse(
		require('fs')
			.readFileSync(path.join(path.dirname(__filename), './package.json'))
			.toString()
	);

	userConfiguration.versionInfo = {
		name: packageInfo.name,
		version: packageInfo.version
	};

	if (!userConfiguration.generateControlFiles) {
		require('./lib/serve')({
			userConfiguration
		});
	} else {
		qt.log(
			`WARNING: An option was chosen that does not include activating http serving.`
		);
	}

	userConfiguration.generateControlFiles &&
		require('./lib/generate-control-files')({
			userConfiguration,
			templateDirectoryPath: path.join(
				__dirname,
				'assets',
				'systemControlTemplates'
			)
		});
};

//END OF moduleFunction() ============================================================

console.log(
	`\n\nJS-LIGHTNING START: ================================ ${new Date().toLocaleString()}`
);
moduleFunction();

