#!/usr/bin/env node
'use strict';

const qt = require('qtools-functional-library');

const path = require('path');
const os = require('os');

//START OF moduleFunction() ============================================================

const moduleFunction = function(args = {}) {
	const { userConfiguration, templateDirectoryPath } = args;

	const outputDirectoryPath =
		typeof userConfiguration.generateControlFiles == 'string'
			? userConfiguration.generateControlFiles
			: path.join(userConfiguration.siteDirectory, userConfiguration.domain);
	
	const rawNetObject = os.networkInterfaces();

	const externalIp = (rawNetObject.en0 || rawNetObject.eth0 || {}) //en0 is a Mac thing, eth0 works for ubuntu
		.qtGetByProperty('family', 'IPv4', [])
		.qtLast({})
		.qtGetSurePath('address', 'noIpAddressFound'); //if qtGetSurePath() finds a simple type, it does not send an array
	
	const fileList = require('qtools-template-replace-for-files')({
		templateDirectoryPath,
		replacementObject: {
			...userConfiguration,
			outputDirectoryPath,
			externalIp
		},
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

