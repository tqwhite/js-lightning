#!/usr/local/bin/node
'use strict';

const qt = require('qtools-functional-library');
const fs = require('fs');
const path = require('path');

//START OF moduleFunction() ============================================================

const moduleFunction = function({ userConfiguration }) {
	const { defaultPageNameList } = userConfiguration;

	const get = (req, callback) => {
console.log(`\n=-=============   get  ========================= [find-dynamic-page.js.moduleFunction]\n`);


		if (req.path.match(/static/i)) {
			callback();
			return;
		}

		const extension = path.extname(req.path);

		if (extension && extension != '.js' && extension != '.md') {
			callback();
			return;
		}

		let reqPath = path.join(userConfiguration.docRootPath, req.path);

		let isModule = filePath =>
			fs.existsSync(path.join(filePath, 'package.json'));

		const chooseValidResult = (item, inx, all) =>
			(all.length < 2 || !item.match(/^.*docRoot\/$/)) &&
			(path.extname(item) == '.js' || path.extname(item) == '.md' || isModule(item));

		const cancelDump = !userConfiguration.verbose;
		const finalPath = (req.path == '/'?defaultPageNameList:[])
			.qtPassThrough(entire => req.path != '/' && entire.push(req.path))
			.qtPassThrough( entire => req.path != '/' && entire.push( 
				path.extname(req.path) == '.js' ? req.path : 
				path.extname(req.path) == '.md' ? req.path : 
				`${req.path}.js` 
			) )
			.qtPassThrough( entire => req.path != '/' && entire.push( `${req.path}.md` ) )
			.qtDump({ label: 'Original complete list', cancelDump })
			.map(fileName => path.join(userConfiguration.docRootPath, fileName))
			.qtDump({ label: 'Mapped to complete paths', cancelDump })
			.filter( filePath => !path.extname(filePath) || path.extname(filePath) == '.js' || path.extname(filePath) == '.md' ? true : false )
			.qtDump({ label: 'non-js and dirs stripped', cancelDump })
			.filter(filePath => fs.existsSync(filePath))
			.qtDump({ label: 'Only existing files and dirs', cancelDump })
			.filter(chooseValidResult)
			.qtDump({ label: 'excess docRoot stripped', cancelDump })
			.qtPassThrough( entire => entire.length > 1 && qt.log(`WARNING: Too many files found. Serving the last one found`) )
			.qtLast( isModule(userConfiguration.docRootPath) ? userConfiguration.docRootPath : void 0 );
		
		(finalPath ? finalPath : 'no final path found').qtDump({
			label: 'finalPath',
			cancelDump
		}); //qtDump() doesn't pass that final value, nasty bug

		callback('', finalPath);
	};

	return { get };
};

//END OF moduleFunction() ============================================================

module.exports = args => new moduleFunction(args);
