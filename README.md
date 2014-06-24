restAPI [![Build Status](https://travis-ci.org/KillerCodeMonkey/restAPI.svg?branch=master)](https://travis-ci.org/KillerCodeMonkey/restAPI)
=======

NodeJS API + crypto + token authentication + multidbsupport

install
=======
1. install nodejs (`sudo apt-get update`
`sudo apt-get install -y gcc g++ make`
`wget http://nodejs.org/dist/node-latest.tar.gz`
`tar -xzvf node-latest.tar.gz`
`cd [CREATED NODE DIR]`
`./configure`
`make`
`sudo make install`
`curl https://www.npmjs.org/install.sh | sh`
2. install mongodb (check if version >2.6.x)
`apt-get install mongodb`
3. clone repo & go in directory
4. run npm install to install all dependencies (run `npm install -g grunt-cli`) afterwards
5. set configs in ./config
6. run `grunt exec:killDB`
7. run `grunt exec:startFirstDB`
7. run `grunt exec:createMongoUsers` // creates mongo users to restrict access
8. run `grunt exec:killDB` // stops all mongo services
9. run `grunt exec:startDB` // start mongo session with authentication
10. run `grunt initSystem -username [sysusername] -password [syspassword] -email [sysemail]` // creates systemdb with sysuser
11. run `grunt reinstall` // creates/recreates test endpoint db 'test' with test data (user, admin, ...) accepts '-target' flag to allow to create a new db with testdata
12. run `grunt` or `grunt start` to start nodejs server

After you have configured your mongo (you only need grunt reinstall and grunt)

Doc
===
index.js -> init server and workers (clustering)
appServer.js -> express server, request handling, middleware for authentication
config -> db, app, require, logging configs
endpoints -> rest endpoints
models -> db models (schema and model)

Models & Endpoints
=================
* For each model an endpoint file with the same name must exist
* on startup all models are loaded and for all models the entpoint file
* model registers the mongoose model with its schema
* versioning
* multidb support: '/api/:version/:database/:classname/id/:id/:action'
* endpoint file returns an object with keys for each method (post, get, put, delete) as values another object with keys '', 'object', '{actionname}'. '' stands for request without objectid like '/api/user'. 'object' for a object call like '/api/v1/restAPI/user/:id' where the object is placed automatically on req.object. '{actionname}' could be used if the default methods are not enough for any purpose like GET '/api/v1/restAPI/user/id/:id/rating' or GET '/api/v1/restAPI/user/activeOnes'.
* additional systemdb for managing/monitoring purposes (or if you need a backoffice for other dbs)
* a model returns mongoose schema, mongo model, and optionally systemdb flag (systemdb: true -> this model is only für systemdb, systemdb: false -> only for the other dbs, not set -> for otherdbs and systemdb)

Next steps
==========
* grunt task for db backup (export/import)
