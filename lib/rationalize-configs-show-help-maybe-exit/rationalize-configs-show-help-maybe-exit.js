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
	
	const defaultConfigurationValues = configFileProcessor.getConfig(
		path.join(__dirname, 'assets', 'systemParameters_defaults.ini')
	);
	defaultConfigurationValues._meta.contributors = [];
	defaultConfigurationValues._meta.contributors = [].qtPush(
		defaultConfigurationValues._meta.qtClone()
	);

	const specialConfigFilePath = commandLineParameters
		.qtGetSurePath('values.configFilePath', [])
		.qtLast();

	const prelimConfig =
		(fs.existsSync(specialConfigFilePath) &&
			configFileProcessor.getConfig(specialConfigFilePath)) ||
		{};
	
	const rawSiteDirectory =
		prelimConfig
			.qtGetSurePath('commandLineParameters.values.siteDirectory', [])
			.qtLast(false) ||
		commandLineParameters
			.qtGetSurePath('values.siteDirectory', [])
			.qtLast(
				commandLineParameters.qtGetSurePath('fileList[0]', process.cwd())
			);

	const siteDirectory = fs.realpathSync(rawSiteDirectory);

	
	const docRootPath = require('./lib/find-docroot')(
		siteDirectory,
		commandLineParameters
	);
	
	const configFileName = commandLineParameters
		.qtGetSurePath('values.configFileName', [])
		.qtLast('systemParameters.ini');

	const configFilePath =
		specialConfigFilePath || path.join(siteDirectory, configFileName);

	const configFileParameters =
		(fs.existsSync(configFilePath) &&
			configFileProcessor.getConfig(configFilePath)) ||
		{};

	//special parameter handling -------------------------------------------------------
	
	if (commandLineParameters.qtGetSurePath('values.defaultPageNameList')) {
		if (
			defaultConfigurationValues.qtGetSurePath(
				'commandLineParameters.values.defaultPageNameList'
			)
		) {
			delete defaultConfigurationValues.commandLineParameters.values
				.defaultPageNameList;
		}
	}
	
	//-------------------------- -------------------------------------------------------

	
	const finalParameterSet = mergeDeep(
		defaultConfigurationValues,
		configFileParameters.qtGetSurePath('commandLineParameters', {}),
		defaultConfigurationValues.qtGetSurePath('commandLineParameters', {}),
		commandLineParameters
	);
	
	const getModuleConfig = function(moduleFileName) {
		return this.qtGetSurePath(
			`moduleConfigs.${require('path')
				.basename(moduleFileName)
				.replace(/\.js$/, '')}`,
				{}
		);
	};

	
	//GET OTHER PARAMETERS ============================================================

	const port = finalParameterSet.values.port
		? finalParameterSet.values.port.qtLast()
		: 7000;

	const noServe = finalParameterSet.qtGetSurePath('switches.noServe', false);
	const verbose = finalParameterSet.qtGetSurePath('switches.verbose', false);
	
	
	const generateControlFiles =
		commandLineParameters.qtGetSurePath(
			'switches.generateControlFiles',
			false
		) ||
		commandLineParameters
			.qtGetSurePath('values.generateControlFiles', [])
			.qtLast();
	//The values variation of generateControlFiles is not documented. It exists so
	//that testing doesn't write into the distribution directory EXAMPLE_SITES,
	//which I use for testing.
	
	const domain = finalParameterSet.qtGetSurePath('values.domain', []).qtLast();

	const defaultPageNameList = finalParameterSet.qtGetSurePath(
		'values.defaultPageNameList',
		[]
	);

	const moduleConfigs = defaultConfigurationValues
		.qtClone()
		.qtPassThrough(entire => delete entire.commandLineParameters);
	
	return {
		moduleConfigs,
		getModuleConfig,
		siteDirectory,
		docRootPath,
		port,
		noServe,
		generateControlFiles,
		domain,
		defaultPageNameList,
		verbose
	};
};

//END OF moduleFunction() ============================================================

module.exports = new moduleFunction();

