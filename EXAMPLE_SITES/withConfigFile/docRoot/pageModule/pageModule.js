#!/usr/local/bin/node
'use strict';
const qt = require('qtools-functional-library');

//START OF moduleFunction() ============================================================

const moduleFunction = function({ req, res, callback = () => {} }) {
	const demoPageName = 'index.html';


	const EXAMPLE_SITES = __filename.match(/EXAMPLE_SITES\/(.*?)\//)[1];
	

	const output = `
HELLO: ${new Date().toLocaleString()}
from: ${req.path} in ${EXAMPLE_SITES}
feel free to try: ${req.protocol}://${req.host}/${demoPageName}
`;
	
	res.send(output);
};

//END OF moduleFunction() ============================================================

module.exports = args => new moduleFunction(args);

