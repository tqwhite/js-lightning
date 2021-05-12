#!/usr/local/bin/node
'use strict';

const qt = require('qtools-functional-library');
const fs = require('fs');
const path = require('path');

//START OF moduleFunction() ============================================================

const moduleFunction = function({ userConfiguration }) {
	const get = (req, callback) => {

		let reqPath = path.join(userConfiguration.docRootPath, req.path);
		
		if (fs.existsSync(reqPath)){
console.log(`\n=-=============   '', reqPath  ========================= [find-dynamic-page.js.moduleFunction]\n`);


'', reqPath.qtDump({label:"'', reqPath"});

console.log(`\n=-=============   '', reqPath  ========================= [find-dynamic-page.js.moduleFunction]\n`);


			callback('', reqPath);
			return;
		}
		
		reqPath=`${reqPath}.js`;
		
		if (fs.existsSync(reqPath)){
			callback('', reqPath);
			return;
		}

		const finalPath =
			path.extname(reqPath) == '.js' ? reqPath : ''; 


		if (reqPath.match(/html/) || !finalPath){
			callback();
			return;
		}
		 callback('', finalPath);
	};

	return { get };
};

//END OF moduleFunction() ============================================================

module.exports = args => new moduleFunction(args);