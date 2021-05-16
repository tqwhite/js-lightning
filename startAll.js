#!/usr/bin/env node
'use strict';

const qt = require('qtools-functional-library');
const path=require('path');

//START OF moduleFunction() ============================================================

const moduleFunction = function() {

	const userConfiguration = require('./lib/rationalize-configs-show-help-maybe-exit'); 
	
	 if (!userConfiguration.generateControlFiles) {
		require('./lib/serve')({
			userConfiguration
		});
	} else {
		qt.log(
			`WARNING: An option was chosen that does not include activating http serving.`
		);
	}


	userConfiguration.generateControlFiles && require('./lib/generate-control-files')({
			userConfiguration,
			templateDirectoryPath:path.join(__dirname, 'assets', 'systemControlTemplates')
		});

};

//END OF moduleFunction() ============================================================

qt.log(`\n\nJS-LIGHTNING START: ================================ ${new Date().toLocaleString()}\n\n`);
moduleFunction();

