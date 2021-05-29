1quickStart

This is the simplest kind of site. It has no structure. It is a list of files that can be served by name.

It can be accessed by

cd .../1quickStart
js-lightning
curl http://localhost:7000

This will serve index.html because that file exists and nothing else was specified. Also, there is no index.js which would be served before index.himl.

curl http://localhost:7000/test

Serves test.js.