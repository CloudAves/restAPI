restAPI
=======

NodeJS API + crypto + token authentication

install
=======
1. install mongodb
2. run npm install to install all dependencies
3. set configs in ./config

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
* testcases -> travisCI, coverage
* grunt task for db backup (export/import)
