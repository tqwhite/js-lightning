#!/usr/local/bin/node
'use strict';


const qt = require('qtools-functional-library');
const fs = require('fs');
const path = require('path');

//START OF moduleFunction() ============================================================

const moduleFunction = function(siteDirectory, commandLineParameters) {

	const docRootName = commandLineParameters
		.qtGetSurePath('values.docRootName', [])
		.qtLast('docRoot');
		
	let docRootPath = commandLineParameters
		.qtGetSurePath('values.docRootPath', [])
		.qtLast(siteDirectory); 
		
		const tmp=path.join(siteDirectory, docRootName);
	
	 if (
		docRootName &&
		fs.existsSync(path.join(siteDirectory, docRootName))
	) {

		docRootPath = path.join(siteDirectory, docRootName);
	}
	
	return docRootPath;
	
	};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;

