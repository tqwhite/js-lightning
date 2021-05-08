
***IMPORTANT NOTE: This is entirely aspirational. It does not yet work at all.***

# js-lightning
 Direct Javascript to Web interpreted server inspired by PHP

**SYNOPSIS**

jsl [path/to/docRoot | path/to/config]

**DESCRIPTION**

Js-lightning presents a website instantly. All the behind the scenes wiring is done automatically to allow http access to a directory of files. 

By default, the file paths map one-to-one with the structure of the directory with the exception that js-lightning does not require a file extension and understands Node modules and treats them as if they were files.

If a file has a usual HTML extension, it is served as normal (using expressjs static routing). If the path points to a ‘path/filename.js’ or to a module ‘path/moduleName’, js-lightning requires it as a dynamic element.

Dynamic elements are provided with the usual request and response objects and are expected to calculate their own html and headers and to send those to the web browser. No callback is provided. Each page is the final step in the request processing.

In addition to request and response, each dynamic page is provided with a ‘lightning’ object that contains utilities and other system access tools including any site specific configuration and utility elements.

The simplest use case is when jsl is invoked with a path to docRoot containing no ‘systemConfig.ini’. In this case, jsl serves the contents of that directory on port 80. New files added to the directory do not require a restart.

If a systemConfig.ini is present, it is parsed and made available to each page. There are (will be) js-lightning specific parameters (eg, port), most of which will be static counterparts to command line flags.

If a directory, public, is present, it will be served instead and the parent is considered to be a siteDirectory. In this case, it is expected that a systemConfig.ini and additional code directories will also be present in the siteDirectory although they are not required.

**QUICK START**

Until I get it ready to publish on npm…

1) clone the repo
2) make a directory (docRoot) containing index.html
3) node path/to/fs-lightning/startAll.js PATH/TO/docRoot
4) visit http://localhost:8080

You can then add a node module, say, test.js, that exports a function that like moduleFunc=function(request, response, systemData)=>res.send(‘hello world’);

Visit it with http://localhost:8080/test (fs-lighting will deal with the .js).

Make a directory containing index.html.

**OPTIONS**

*(Note: Command line options are specified according to  qtools-parse-command-line. Especially, a double-hyphen specifies a flag that takes a value not an alias of a short flag. All flags must be specified before files. Flags that take values can be joined to the value (sometimes a comma-separated list) with an equal sign or a space.)*

Flags specified in the command line take precedence over those specified in systemConfig.ini (if any).

—\-port=VALUE	The port the system will listen to. (Default is 80.)


**EXAMPLES**

Jsl —\-port=8080