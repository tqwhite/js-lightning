#!/usr/local/bin/node
'use strict';

const qt = require('qtools-functional-library');

//START OF moduleFunction() ============================================================

const moduleFunction = function(args = {}) {
	 
	return `
============================================================

NAME

	js-lightning (jsl) - Direct Javascript to Web interpreted server inspired by PHP

SYNOPSIS

	jsl [--port=XXX] [path/to/siteDirectory]

DESCRIPTION

	Instant web server for Javascript applications (.js, modules and all the normal html-ish stuff) in a single command.

OPTIONS

--port	Specify the port to server (default is 7000)

-help, --help	show this help message

-noServe	Debugging switch. Do not start expressjs listener

SOURCE CONTROL

siteDirectory

Path to the js-lightning control directory. Can be received as value of --siteDirectory or as the file argument on the CLI call. If neither is specified default is current working directory.

--siteDirectory	Path to control directory. Overrides command line file parameter. siteDirectory can also be specified in a configuration file (see below)

docRoot	

Files to be served are contained in a docRoot directory. By default, this is either the same directory as siteDirectory or siteDirectory/docRoot, if it exists.

--docRootName	The name of the directory containing files to be served within the siteDirectory. Default is 'docRoot'. Optional.
--docRootPath	The path to the file serving directory if it is not in the siteDirectory. Optional.

Only one of --docRootName or --docRootPath is allowed.

--configFileName	The optional name of the file inside the siteDirectory. Default is 'systemParameters.ini'.
--configFilePath	The path to a configuration file. Default is 'siteDirectory/systemParameters.ini'.

Configuration file notes.

1) No configuration file is required. All necessary parameters are defaulted. All can be specified with command line flags.
2) There are optional parameters that can only be specified in a configuration file.
3) A config file can specify any or all parameters that can be specified on the command line. If a parameter is in both, the command line wins.
4) Only one of --configFileName or --configFilePath is allowed.
5) The location of the configuration file is normally inferred from the siteDirectory, using either the default or specified file name. If '--configFilePath' is specified, that will take precedence and the file can be anywhere in the file system.



INSTALLING

On Macintosh: 

cd project/dir; npm i js-lightning; sudo ln -s project/dir/node_modules/js-lightning/system/code/startAll.js /usr/local/bin/jsl

sudo npm install js-lightning -g; mv /usr/local/lib/node_modules/js-lightning /usr/local/lib/node_modules/jsl

EXAMPLES

jsl --siteDirectory /Users/tqwhite/Documents/webdev/jsLightning/system/siteDirectory --port=7001

============================================================
`;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction();
