#!/usr/local/bin/node
'use strict';

const qt = require('qtools-functional-library');
const fs = require('fs');
const path = require('path');

//START OF moduleFunction() ============================================================

const moduleFunction = function({ userConfiguration }) {
	const get = (req, callback) => {

		if(req.path.match(/static/i)){
			callback();
			return;
		}
		
		const extension=path.extname(req.path);
		
		if(extension && extension!='.js'){
			callback();
			return;
		}

		let reqPath = path.join(userConfiguration.docRootPath, req.path);
		let finalPath;
		
		
		if (fs.existsSync(reqPath)){
			finalPath=reqPath;
		}
		else if (fs.existsSync(`${reqPath}.js`)){
			finalPath=`${reqPath}.js`;
		}



		 callback('', finalPath);
	};

	return { get };
};

//END OF moduleFunction() ============================================================

module.exports = args => new moduleFunction(args);