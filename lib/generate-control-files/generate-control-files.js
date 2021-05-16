#!/usr/bin/env node
'use strict';

const qt = require('qtools-functional-library');

const path = require('path');

//START OF moduleFunction() ============================================================

const moduleFunction = function(args = {}) {
	const { userConfiguration, templateDirectoryPath } = args;

	const outputDirectoryPath =
		typeof userConfiguration.generateControlFiles == 'string'
			? userConfiguration.generateControlFiles
			: path.join(userConfiguration.siteDirectory, userConfiguration.domain);

	const fileList = require('qtools-template-replace-for-files')({
		templateDirectoryPath,
		replacementObject: userConfiguration,
		outputDirectoryPath
	});

	// prettier-ignore
	{
		qt.log(`\nControl Files: =========================================================\n`, { noSuffix: true });
		fileList.qtDump({ noSuffix: true });
		qt.log(`\n=======================================================================\n`, { noSuffix: true });
	}
	
	return fileList;
};

//END OF moduleFunction() ============================================================

module.exports = args => moduleFunction(args);

