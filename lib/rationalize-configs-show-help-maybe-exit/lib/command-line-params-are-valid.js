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

// const commandLineParser = require('qtools-parse-command-line');
// const commandLineParameters = commandLineParser.getParameters();

const qt = require('qtools-functional-library');
//console.dir(qt.help());

console.log(`HELLO FROM: ${__filename}`);

//START OF moduleFunction() ============================================================

const moduleFunction = function(commandLineParameters) {

	const validControls = [
		'-noServe',
		'-help',
		'--docRootPath',
		'--docRootName',
		
		'--siteDirectory',
		'--port'
		
	];

	const errors = process.argv.filter(item => item.match(/^-/)).filter(item => {
		return !validControls.filter(validItem => item.match(validItem)).length;
	});
	
	const docRootName=commandLineParameters.qtGetSurePath('values.docRootName', []).qtLast();
	const docRootPath=commandLineParameters.qtGetSurePath('values.docRootPath', []).qtLast();

if(docRootName && docRootPath){
	errors.push('ERROR: Not allowed to define both --docRootPath and --docRootName');
}

	if (errors.length) {
		const errList = errors
			.reduce((result, item) => result + item + ', ', '')
			.replace(/, $/, '');
		return `Bad flags in command line ${errList} (did you miss double hyphen?`;
	}


	return
};

//END OF moduleFunction() ============================================================

module.exports = args=>moduleFunction(args)
//module.exports = moduleFunction;
//module.exports = new moduleFunction();
//moduleFunction().workingFunction().qtDump();

