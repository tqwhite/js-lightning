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

const moduleFunction = function() {
	 
	const commandLineParameters = commandLineParser.getParameters();

	if (
		!['command1', 'command2'].includes(commandLineParameters.fileList.qtLast())
	) {
		require('./lib/serve')({
			commandLineParameters
		});
	}
	
};

//END OF moduleFunction() ============================================================

moduleFunction();

