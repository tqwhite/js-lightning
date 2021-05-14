#!/usr/local/bin/node
'use strict';

const configFileProcessor = require('qtools-config-file-processor');

const commandLineParser = require('qtools-parse-command-line');

const qt = require('qtools-functional-library');

const fs = require('fs');
const path = require('path');

const mergeDeep = require('merge-deep');

//START OF moduleFunction() ============================================================

const moduleFunction = function(args = {}) {
	const commandLineParameters = commandLineParser.getParameters();

	const showHelpAndDie = message => {
		console.error(helpText);
		message && console.error(message);
		process.exit(1);
	};
	
	const helpText = require('./lib/help-text');

	//VALIDATE COMMAND LINE ============================================================

	const flagErrors = require('./lib/command-line-params-are-valid')(
		commandLineParameters
	);

	flagErrors && showHelpAndDie(flagErrors);

	//SHOW HELP IF NEEDED ============================================================

	commandLineParameters.qtGetSurePath('switches.help', false) &&
		showHelpAndDie();
	commandLineParameters.qtGetSurePath('values.help') && showHelpAndDie(); //remember, qtools-parse-command shows boolean for --flags without a value
	
	//FIGURE OUT CONFIGURATION AND SITE DIRECTORY ============================================================
	
	//note: configuration can be specified on the command line. The config can optionally
	// specify the siteDirectory. That's why I run configFileProcessor twice.
	
	const specialConfigFilePath = commandLineParameters
		.qtGetSurePath('values.configFilePath', [])
		.qtLast();

	const prelimConfig =
		(fs.existsSync(specialConfigFilePath) &&
			configFileProcessor.getConfig(specialConfigFilePath)) ||
		{};
	

	
	const siteDirectory =
		prelimConfig
			.qtGetSurePath('commandLineParameters.values.siteDirectory', [])
			.qtLast(false) ||
		commandLineParameters
			.qtGetSurePath('values.siteDirectory', [])
			.qtLast(
				commandLineParameters.qtGetSurePath('fileList[0]', process.cwd())
			);

	
	const docRootPath = require('./lib/find-docroot')(
		siteDirectory,
		commandLineParameters
	);
	
	const configFileName = commandLineParameters
		.qtGetSurePath('values.configFileName', [])
		.qtLast('systemParameters.ini');
		
	const configFilePath = specialConfigFilePath || path.join(siteDirectory, configFileName);

	const configFileParameters =
		(fs.existsSync(configFilePath) &&
			configFileProcessor.getConfig(configFilePath)) ||
		{};
	
	const finalParameterSet = mergeDeep(
		configFileParameters.qtGetSurePath('commandLineParameters', {}),
		commandLineParameters
	);
	
	//GET OTHER PARAMETERS ============================================================

	const port = finalParameterSet.values.port
		? finalParameterSet.values.port.qtLast()
		: 7000;
	const noServe = finalParameterSet.qtGetSurePath('switches.noServe', false);
	return { siteDirectory, docRootPath, port, noServe };
};

//END OF moduleFunction() ============================================================

module.exports = new moduleFunction();

