#!/usr/bin/env node
'use strict';

const bodyParser=require('body-parser');

//START OF moduleFunction() ============================================================

const moduleFunction = ({ jslScope }) => {
	const { configuration, expressjs, refreshRequire } = jslScope;
	const { app } = expressjs; //res, req, next are not available during intialization};
	configuration.HELLO='goodbye';
	console.log('JSL-INIT added bodyParser to expressJS');
	app.use(bodyParser.json({ limit: '10000kb' }));
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;

