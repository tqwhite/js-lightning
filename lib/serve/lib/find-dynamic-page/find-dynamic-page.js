#!/usr/local/bin/node
'use strict';

const qt = require('qtools-functional-library');
const fs = require('fs');
const path = require('path');

//START OF moduleFunction() ============================================================

const moduleFunction = function({ userConfiguration }) {
	const get = (req, callback) => {

		const reqPath = path.join(userConfiguration.docRootPath, req.path);

		const finalPath =
			path.extname(reqPath) == '.js' ? reqPath : ''; 

		 callback('', finalPath);
	};

	return { get };
};

//END OF moduleFunction() ============================================================

module.exports = args => new moduleFunction(args);