## Direct Javascript to Web interpreted server inspired by PHP

---

**SYNOPSIS**

jsLightning *(invoked from within a directory containing website files)*

jsLightning -\-port=80 —siteDirectory /path/to/siteDirectory

jsLightning -generateControlFiles -\-domain=something.com

jsLightning -\-help *(for many more options)*

**DESCRIPTION**

jsLightning presents a website instantly. All the behind the scenes wiring is done automatically to allow http access to a directory of web files. Files added or changed are available without restart. It can be used for convenience or as the foundation for a production app or api.

**USAGE**

The simplest usage (and one that is completely valid) is to navigate to a directory that has web pages (.html) or apps (.js) and type `jsLightning`. This will publish that directory as a website on the default port, 7000.

By default, the file paths map one-to-one with the structure of the directory with the exception that jsLightning does not require a file extension for .js files. It also understands Node module directories. They are evaluated and served as if they were files.

If a file has a usual HTML extension (.html, .png, etc), it is served as normal (using expressjs static routing). If the path points to a ‘path/filename.js’ or to a module ‘path/moduleDirName’, jsLightning treats it as a dynamic element. The simplest example is:

    module.exports=(req, res, jslScope)=>res.send('hello world');

To support javascript front-end script elements, jsLightning will not interpret .js files contained in any directory that has the string `static` in it. This can be used, for example, to add .../staticAssets/jQuery.js to a page. 

The siteDirectory can contain a directory called `docRoot`. If this is present, files will be served from here instead. Files that should not be served directly (node_modules, RSA keys, etc) can be placed in siteDirectory and be accessible to pages/apps being served.

**PROGRAMMING**

Dynamic elements are provided with the usual request and response objects and are expected to calculate their own HTML and headers and to send those to the web browser. No callback is provided. Each page is the final step in the request processing.

In addition to request and response, each dynamic page is provided with a system object, jslScope, that contains utilities and other system access tools including any site specific configuration and utility elements. It can be written to and used to communicate throughout the system.

The simplest use case is when jsLightning is invoked with a path to docRoot containing no ‘systemConfig.ini’. In this case, jsLightning serves the contents of that directory on the default port 7000. New files added to the directory do not require a restart.

However, NodeJS caches all require()'d modules. Without special care, these will not be reloaded when changed. To overcome this problem, a utility function, refreshRequire(), is delivered to the page in the jslScope object. It will delete the requested module from the cache and require() it anew. If desired, an options parameter, noRefreshNormalRequire, can be set true to suppress dynamic processing. EG,

    const someModule=refreshRequire('someModule', {noRefreshNormalRequire:true})

If a systemConfig.ini is present, it is parsed and made available to each page. Any parameter specified with a command line flag (eg, -\-port) can be specified in systemConfig.ini. It can also be used for custom parameters. The entire systemParameters object is provided to dynamic pages.

**QUICK START**

1) make project directory and install (**npm install js-lightning**)

2) make another directory (siteDirectory) containing index.html

3) node path/to/system/code/startAll.js *path/to*/siteDirectory

4) visit http://localhost:7000/index.html

You can also add a node module, say, test.js, that exports a function like 

`module.exports=(req, res, jslScope)=>res.send('hello world’);`

Visit it with http://localhost:7000/test.js

Use 

`node path/to/system/code/startAll.js -help `

for current features.

**INITIALIZATION**

An optional module can be included in the site directory called jsl-init. If it is found, it is executed after the configuration is found and before the first app.use().

It's main purpose is to further initialize expressJS, eg, with body-parser. Of course, it must be installed and required.

jsl-init can contribute to the rest of the system by adding to the jslScope object, which is not mutable after initialization.

**OPTIONS**

*(Note: Command line options are specified according to  qtools-parse-command-line. Especially, a double-hyphen specifies a flag that takes a value not an alias of a short flag. All flags must be specified before files. Flags that take values can be joined to the value (sometimes a comma-separated list) with an equal sign or a space.)*

Flags specified in the command line take precedence over those specified in systemConfig.ini (if any).

-help is the place to look for command line options (also --help)

-verbose shows messages that are helpful for debugging, especially path analysis

**EXAMPLES**

jsLightning —\-port=7500

jsLightning —\-port=7500 -verbose

**CHANGE LOG**

Version 2.0.7: Added verbose switch. Made jslScope immutable. Added jsl-init (add app.use() middleware; initialize jslScope).

Version 2.0.0: Breaking change: The page module signature has changed. It was a named parameters style (destructured object). 

I realized that is very brittle and requires users to get my names right. The signature is now position parameters. EG...

OLD: `module.exports=({req, res, jslScope})=>res.send('hello world’);`

NEW: `module.exports=(req, res, jslScope)=>res.send('hello world’);`

Also, the third parameter, jslScope, is now defined. It provides access to configuration and the expressJs methods.

___

*These bits are here pending the creation of a supporting website.*

**NOTES**

Things that work:

* Simple .js module files
* CommonJS modules
* Plain HTML
* Static served Javascript.
* Automatic inclusion of new pages without restart
* Specification of siteDirectory based on flag (-\-SiteDirectory), file path in command line (jsLightning path/to/dir) and from the current working directory when nothing else is specified.
* DocRoot is automatically set to siteDirectory/docRoot if docRoot is present. Otherwise, docRoot==siteDirectory.
* EXAMPLE_SITES exists and has README.
* A configuration file (default name ‘systemParameters.ini’) can be placed in the siteDirectory. It can specify any of the parameters that can be specified on the command line (if they are also specified on the command line, that takes precedence). 
* The configuration file can be located outside of a siteDirectory and specified with the -\-configDirectoryPath parameter. This takes precedence over any default config file location.
* -generateControlFiles files works
* --defaultPageNameList specifies a new list of file names to use if none is provided in the URL. Default is `index, index.js, index.html`. Eg,  `--defaultPageNameList=main.js,main.html` (no spaces in list)

**FAQ**

Q: Where is the tutorial?

A: Here it is:

1. Make a directory. Activate jsLightning on it (here’s the command `jsLightning path/to/dir`). 

2. Save a Javascript file containing `module.exports=(req, res, jslScope)=>res.send('hello world’);` 

3. Have fun.

Q: What if I want to have a normal web page?

A: Have one. All non-JS (and soon to be non-markdown) pages are just passed on through. JS pages in a directory with the string ‘static’ in its name are passed through, too.

**ROADMAP**

*(Not in order.)*

Add interpreter support for markdown files so they are converted to html.

Add html template mechanism so that interpreted results can be embedded in html automatically, especially markdown.

Add routing.

Add restart all processes signal.

Add show valid pages list system function

Add a -useModuleCache if the project is mature and you are willing to restart to have the system reflect changes in code. New pages/apps will still be recognized.

Add a unix signal to force page/app reload (clear cache) if -useModuleCache is on without interruption other processing.

DONE Add generate scripts to deploy nginx, systems, etc

DONE Implement systemParameters.ini with specs for all command line flags.

**OTHER GOOD STUFF BY [TQ WHITE II](http://tqwhite.com)**

[qtools-functional-library](https://www.npmjs.com/package/qtools-functional-library)

[qtools-parse-command-line](https://www.npmjs.com/package/qtools-parse-command-line)

[qtools-asynchronous-pipe-plus](https://www.npmjs.com/package/qtools-asynchronous-pipe-plus)

[qtools-config-file-processor](https://www.npmjs.com/package/qtools-config-file-processor)

[qtools-template-replace-for-files](https://www.npmjs.com/package/qtools-template-replace-for-files)
