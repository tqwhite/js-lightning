
***IMPORTANT NOTE: Much of this is aspirational. This is in development. The quick start works. The **ROADMAP** section below has information about what works. Also, look at **EXAMPLE_SITES** and **-\-help** in the app.***

# js-lightning
 Direct Javascript to Web interpreted server inspired by PHP

**SYNOPSIS**

jsl [path/to/docRoot | path/to/config]

**DESCRIPTION**

Js-lightning presents a website instantly. All the behind the scenes wiring is done automatically to allow http access to a directory of files. 

By default, the file paths map one-to-one with the structure of the directory with the exception that js-lightning does not require a file extension and understands Node modules and treats them as if they were files.

If a file has a usual HTML extension, it is served as normal (using expressjs static routing). If the path points to a ‘path/filename.js’ or to a module ‘path/moduleDirName’, js-lightning treats it as a dynamic element.

Dynamic elements are provided with the usual request and response objects and are expected to calculate their own HTML and headers and to send those to the web browser. No callback is provided. Each page is the final step in the request processing.

In addition to request and response, each dynamic page is provided with a system object that contains utilities and other system access tools including any site specific configuration and utility elements.

The simplest use case is when jsl is invoked with a path to docRoot containing no ‘systemConfig.ini’. In this case, jsl serves the contents of that directory on port 80. New files added to the directory do not require a restart.

If a systemConfig.ini is present, it is parsed and made available to each page. There are (will be) js-lightning specific parameters (eg, port), most of which will be static counterparts to command line flags.

If a directory, public, is present, it will be served instead and the parent is considered to be a siteDirectory. In this case, it is expected that a systemConfig.ini and additional code directories will also be present in the siteDirectory although they are not required.

**QUICK START**


1) make project directory and install (**npm install js-lightning**)

2) make another directory (siteDirectory) containing index.html

3) node path/to/system/code/startAll.js *path/to*/siteDirectory

4) visit http://localhost:7000/index.html

You can then add a node module, say, test.js, that exports a function like 

`module.exports=({req, res, userConfiguration})=>res.send('hello world’);`

Visit it with http://localhost:7000/test.js

Use 

`node path/to/system/code/startAll.js -help `

for current features.


**OPTIONS**

*(Note: Command line options are specified according to  qtools-parse-command-line. Especially, a double-hyphen specifies a flag that takes a value not an alias of a short flag. All flags must be specified before files. Flags that take values can be joined to the value (sometimes a comma-separated list) with an equal sign or a space.)*

Flags specified in the command line take precedence over those specified in systemConfig.ini (if any).

—\-port=VALUE	The port the system will listen to. (Default is 7000.)

**EXAMPLES**

jsl —\-port=7000

___

*These bits are here pending the creation of a supporting website.*

**USAGE NOTES**

In js-lightning, the word ‘page’ refers to something that can be referenced in a URL path, even if that path refers to a Javascript file that generates HTML. Even CommonJS modules like that are called pages.

Any directory whose name is a string matching `/static/i` is exempt from interpretation and is served as a normal file. This is where front end javascript modules should be located, eg, jquery.js. Non-interpreted assets, images, etc, can be located here as well, or anyplace else.

Things that work:

* Simple .js module files
* CommonJS modules
* Plain HTML
* Static served Javascript.
* Automatic inclusion of new pages without restart
* Specification of siteDirectory based on flag (-\-SiteDirectory), file path in command line (jsl path/to/dir) and from the current working directory when nothing else is specified.
* DocRoot is automatically set to siteDirectory/docRoot if docRoot is present. Otherwise, docRoot==siteDirectory.
* EXAMPLE_SITES exists and has README.
* A configuration file (default name ‘systemParameters.ini’) can be placed in the siteDirectory. It can specify any of the parameters that can be specified on the command line (if they are also specified on the command line, that takes precedence). 
* The configuration file can be located outside of a siteDirectory and specified with the -\-configDirectoryPath parameter. This takes precedence over any default config file location.

**FAQ**

Q: Where is the tutorial?

A: Here it is:

1. Make a directory. Activate js-lightning on it (here’s the command `js-lightning path/to/dir`). 

2. Save a Javascript file containing `module.exports=({req, res, userConfiguration})=>res.send('hello world’);` 

3. Have fun.

Q: What if I want to have a normal web page?

A: 

**ROADMAP**

*(Not in order.)*

Implement systemParameters.ini with specs for all command line flags.

Add ‘-installJsl’ option to execute `ln -s path/to/js-lightning /usr/local/bin/jsl` for convenient usage.

Add ‘—\-createNginxConf=filePath’ to generate an nginx clause to serve the site referenced.

Add ‘-\-createSystemd=filePath’ to generate a system (also launchctl) unit definition to keep js-lightning running for the site referenced.

Add interpreter support for markdown files so they are converted to html.

Add html template mechanism so that interpreted results can be embedded in html automatically, especially markdown.

Add routing.

Add restart all processes signal.
 

