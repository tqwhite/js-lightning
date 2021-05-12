#!/usr/local/bin/node
'use strict';
// const qtoolsGen = require('qtools');
// const qtools = new qtoolsGen(module, { updatePrototypes: true });

//npm i qtools-functional-library
//npm i qtools-config-file-processor
//npm i qtools-parse-command-line

// const configFileProcessor = require('qtools-config-file-processor');
//const configSegmentName=require('path').basename(__filename).replace(/\.\w+$/, '');
//const configPath=path.join(schUtilitiesProjectRoot, 'configs','instanceSpecific', PROJECT_NAMEConfigDirName, 'systemConfig.ini')
//const config = configFileProcessor.getConfig(configPath)['MODULE_NAME'];

const commandLineParser = require('qtools-parse-command-line');

const qt = require('qtools-functional-library');
//console.dir(qt.help());

//START OF moduleFunction() ============================================================

const moduleFunction = function(args = {}) {
	const commandLineParameters = commandLineParser.getParameters();

	const showHelpAndDie = message => {
		console.error(helpText);
		message &&
			console.error(message);
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
	
	//FIGURE OUT FILE SYSTEM ============================================================
	

	const siteDirectory = commandLineParameters
		.qtGetSurePath('values.siteDirectory', [])
		.qtLast(commandLineParameters.qtGetSurePath('fileList[0]', process.cwd()));
	
	const docRootPath=require('./lib/find-docroot')(siteDirectory, commandLineParameters);


	//GET OTHER PARAMETERS ============================================================

	const port = commandLineParameters.values.port
		? commandLineParameters.values.port.qtLast()
		: 7000;
	const noServe = commandLineParameters.qtGetSurePath(
		'switches.noServe',
		false
	); 
	 return { siteDirectory, docRootPath, port, noServe };
};

//END OF moduleFunction() ============================================================

module.exports = new moduleFunction(); 

