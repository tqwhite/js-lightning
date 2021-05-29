
 Direct Javascript to Web interpreted server inspired by PHP

**SYNOPSIS**

js-lightning *(invoked from within a directory containing website files)*

js-lightning -\-port=80 —siteDirectory /path/to/siteDirectory

js-lightning -generateControlFiles -\-domain=something.com

js-lightning -\-help *(for many more options)*

**DESCRIPTION**

js-lightning presents a website instantly. All the behind the scenes wiring is done automatically to allow http access to a directory of web files. Files added or changed are available without restart.

**USAGE**

The simplest usage (and one that is completely valid) is to navigate to a directory that has web pages (.html) or apps (.js) and type `js-lightning`. This will publish that directory as a website on the default port, 7000.

By default, the file paths map one-to-one with the structure of the directory with the exception that js-lightning does not require a file extension for .js files. It also understands Node module directories. They are evaluated and served as if they were files.

If a file has a usual HTML extension (.html, .png, etc), it is served as normal (using expressjs static routing). If the path points to a ‘path/filename.js’ or to a module ‘path/moduleDirName’, js-lightning treats it as a dynamic element.

To support javascript front-end script elements, js-lightning will not interpret .js files contained in any directory that has the string `static` in it. This can be used, for example, to add .../staticAssets/jQuery.js to a page. 

The siteDirectory can contain a directory called `docRoot`. If this is present, files will be served from here instead. Files that should not be served directly (node_modules, RSA keys, etc) can be placed in siteDirectory and be accessible to pages/apps being served.

**INSTALLATION NOTE**

I have not yet figured out how to get npm to install a symbolic link for the $PATH. Embarassing but it's true. For now, you need to do those finishing steps yourself. I use MacOS and Ubuntu. Here are commands that will accomplish the needed actions.

Ubuntu

	ln -s /usr/local/lib/node_modules/js-lightning/startAll.js /usr/local/bin/js-lightning
	chmod +x /usr/local/lib/node_modules/js-lightning/startAll.js

MacOS

 	ln -s /Users/tqwhite/Documents/webdev/jsLightning/system/code/startAll.js /usr/local/bin/js-lightning
 	chmod +x /Users/tqwhite/Documents/webdev/jsLightning/system/code/startAll.js


**PROGRAMMING**

Dynamic elements are provided with the usual request and response objects and are expected to calculate their own HTML and headers and to send those to the web browser. No callback is provided. Each page is the final step in the request processing.

In addition to request and response, each dynamic page is provided with a system object that contains utilities and other system access tools including any site specific configuration and utility elements.

The simplest use case is when js-lightning is invoked with a path to docRoot containing no ‘systemConfig.ini’. In this case, js-lightning serves the contents of that directory on the default port 7000. New files added to the directory do not require a restart.

If a systemConfig.ini is present, it is parsed and made available to each page. Any parameter specified with a command line flag (eg, -\-port) can be specified in systemConfig.ini. It can also be used for custom parameters. The entire systemParameters object is provided to dynamic pages.

**QUICK START**

1) make project directory and install (**npm install js-lightning**)

2) make another directory (siteDirectory) containing index.html

3) node path/to/system/code/startAll.js *path/to*/siteDirectory

4) visit http://localhost:7000/index.html

You can also add a node module, say, test.js, that exports a function like 

`module.exports=({req, res, userConfiguration})=>res.send('hello world’);`

Visit it with http://localhost:7000/test.js

Use 

`node path/to/system/code/startAll.js -help `

for current features.


**OPTIONS**

*(Note: Command line options are specified according to  qtools-parse-command-line. Especially, a double-hyphen specifies a flag that takes a value not an alias of a short flag. All flags must be specified before files. Flags that take values can be joined to the value (sometimes a comma-separated list) with an equal sign or a space.)*

Flags specified in the command line take precedence over those specified in systemConfig.ini (if any).

-\-help is the place to look for command line options

**EXAMPLES**

js-lightning —\-port=7500

___

*These bits are here pending the creation of a supporting website.*

**NOTES**

Things that work:

* Simple .js module files
* CommonJS modules
* Plain HTML
* Static served Javascript.
* Automatic inclusion of new pages without restart
* Specification of siteDirectory based on flag (-\-SiteDirectory), file path in command line (js-lightning path/to/dir) and from the current working directory when nothing else is specified.
* DocRoot is automatically set to siteDirectory/docRoot if docRoot is present. Otherwise, docRoot==siteDirectory.
* EXAMPLE_SITES exists and has README.
* A configuration file (default name ‘systemParameters.ini’) can be placed in the siteDirectory. It can specify any of the parameters that can be specified on the command line (if they are also specified on the command line, that takes precedence). 
* The configuration file can be located outside of a siteDirectory and specified with the -\-configDirectoryPath parameter. This takes precedence over any default config file location.
* -generateControlFiles files works

**FAQ**

Q: Where is the tutorial?

A: Here it is:

1. Make a directory. Activate js-lightning on it (here’s the command `js-lightning path/to/dir`). 

2. Save a Javascript file containing `module.exports=({req, res, userConfiguration})=>res.send('hello world’);` 

3. Have fun.

Q: What if I want to have a normal web page?

A: Have one. All non-JS (and soon to be non-markdown) pages are just passed on through. JS pages in a directory with the string ‘static’ in its name are passed through, too.

**ROADMAP**

*(Not in order.)*

Add interpreter support for markdown files so they are converted to html.

Add html template mechanism so that interpreted results can be embedded in html automatically, especially markdown.

Add routing.

Add restart all processes signal.

Figure out npm mechanism to install `ln -s path/to/js-lightning /usr/local/bin/js-lightning` for convenient usage.
ateControlFiles; automatically creates all control files.)*

Add get valid pages list system function

DONE Add generate scripts to deploy nginx, systems, etc

DONE Implement systemParameters.ini with specs for all command line flags.

**OTHER GOOD STUFF BY [TQ WHITE II](http://tqwhite.com)**

[qtools-functional-library](https://www.npmjs.com/package/qtools-functional-library)

[qtools-parse-command-line](https://www.npmjs.com/package/qtools-parse-command-line)

[qtools-asynchronous-pipe-plus](https://www.npmjs.com/package/qtools-asynchronous-pipe-plus)

[qtools-config-file-processor](https://www.npmjs.com/package/qtools-config-file-processor)

[qtools-template-replace-for-files](https://www.npmjs.com/package/qtools-template-replace-for-files)

