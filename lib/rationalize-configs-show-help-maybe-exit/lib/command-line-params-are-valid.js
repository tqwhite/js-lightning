#!/usr/local/bin/node
'use strict';
const qt = require('qtools-functional-library');

//START OF moduleFunction() ============================================================

const moduleFunction = function(commandLineParameters) {

	const validControls = [
		'-noServe',
		'-help',
		'--docRootPath',
		'--docRootName',
		
		'--siteDirectory',
		'--port',
		
		'--configFileName',
		'--configFilePath',
		
		'--generateControlFiles',
		'-generateControlFiles',
		'--domain'
		
	];

	const errors = process.argv.filter(item => item.match(/^-/)).filter(item => {
		return !validControls.filter(validItem => item.match(validItem)).length;
	});
	
	const docRootName=commandLineParameters.qtGetSurePath('values.docRootName', []).qtLast();
	const docRootPath=commandLineParameters.qtGetSurePath('values.docRootPath', []).qtLast();

if(docRootName && docRootPath){
	errors.push('ERROR: Not allowed to define both --docRootPath and --docRootName');
}
	
	const configFileName=commandLineParameters.qtGetSurePath('values.configFileName', []).qtLast();
	const configFilePath=commandLineParameters.qtGetSurePath('values.configFilePath', []).qtLast();

if(configFileName && configFilePath){
	errors.push('ERROR: Not allowed to define both --configFileName and --configFilePath');
}


	
	const generateControlFiles=
		commandLineParameters.qtGetSurePath('switches.generateControlFiles', false) ||
		commandLineParameters.qtGetSurePath('values.generateControlFiles', []).qtLast();
		
	const domain=commandLineParameters.qtGetSurePath('values.domain', []).qtLast();

if(generateControlFiles && !domain){
	errors.push('ERROR: --generateControlFiles REQUIRES that --domain be specified.');
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