#!/usr/local/bin/node
'use strict';
const qt = require('qtools-functional-library');

//START OF moduleFunction() ============================================================

const moduleFunction = function({ req, res, callback = () => {} }) {
	const demoPageName = 'index.html';
	const EXAMPLE_SITES = __filename.match(/EXAMPLE_SITES\/(.*?)\//)[1];

	const output = `
HELLO: ${new Date().toLocaleString()}<br>
from: ${req.path} in ${EXAMPLE_SITES}<br>
feel free to try: <a href='${req.protocol}://${req.host}/${demoPageName}'<>${req.protocol}://${req.host}/${demoPageName}</a>`;
	
	res.removeHeader('X-Powered-By');
	res.setHeader('author', 'tqwhite');
	res.send(output);
};

//END OF moduleFunction() ============================================================

module.exports = args => new moduleFunction(args);

