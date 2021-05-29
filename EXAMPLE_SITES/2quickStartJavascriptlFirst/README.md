2quickStartJavascriptlFirst

This is the simplest kind of site. It has no structure. It is a list of files that can be served by name.

Different from 1quickStartHtmlFirst, this one has index.js.

It can be accessed by

cd .../2quickStartJavascriptlFirst
js-lightning
curl http://localhost:7000

This will serve index.js because that file exists and nothing else was specified. NOte that index.js takes precedence over index.himl.

curl http://localhost:7000/index.html

Serves index.html.