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

const moduleFunction = function(args={}) {


const commandLineParameters = commandLineParser.getParameters();
	
const siteDirectory=commandLineParameters.fileList.qtLast();
const port=commandLineParameters.values.port?commandLineParameters.values.port.qtLast():7000

	return {siteDirectory, port};
};

//END OF moduleFunction() ============================================================

module.exports = new moduleFunction();

