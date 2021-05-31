#!/usr/local/bin/node
'use strict';

const qt = require('qtools-functional-library');
const fs = require('fs');
const path = require('path');

//START OF moduleFunction() ============================================================

const moduleFunction = function({ userConfiguration }) {

	const { defaultPageNameList } = userConfiguration;

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

		let isModule = filePath=>fs.existsSync(path.join(filePath, 'package.json'));

		const chooseValidResult=(item, inx, all)=>((all.length<2 || !item.match(/^.*docRoot\/$/)) && (path.extname(item)=='.js' || isModule(item)))

		const cancelDump=true;
		const finalPath=defaultPageNameList
			.qtPush(req.path)
			.qtPush( path.extname(req.path)=='.js'?req.path:`${req.path}.js`)
			.qtDump({label:'Original complete list', cancelDump})
			.map(fileName=>path.join(userConfiguration.docRootPath, fileName))
			.qtDump({label:'Mapped to complete paths', cancelDump})
			.filter(filePath=>(!path.extname(filePath) || path.extname(filePath)=='.js')?true:false)
			.qtDump({label:'non-js and dirs stripped', cancelDump})
			.filter(filePath=>fs.existsSync(filePath))
			.qtDump({label:'Only existing files and dirs', cancelDump})
			.filter(chooseValidResult)
			.qtDump({label:'excess docRoot stripped', cancelDump})
			.qtPassThrough(entire=>entire.length>1 && qt.log(`WARNING: Too many files found. Serving the last one found`))
			.qtLast(isModule(userConfiguration.docRootPath)?userConfiguration.docRootPath:void(0));

		(finalPath?finalPath:'no final path found').qtDump({label:'finalPath', cancelDump}); //qtDump() doesn't pass that final value, nasty bug


		callback('', finalPath);
	};

	return { get };
};

//END OF moduleFunction() ============================================================

module.exports = args => new moduleFunction(args);