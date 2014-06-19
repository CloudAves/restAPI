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

Model & Endpoints
=================
* For each model an endpoint file with the same name must exist
* on startup all models are loaded and for all models the entpoint file
* model registers the mongoose model with its schema
* endpoint file returns an object with keys for each method (post, get, put, delete) as values another object with keys '', 'object', '{actionname}'. '' stands for request without objectid like '/api/user'. 'object' for a object call like '/api/user/:id' where the object is placed automatically on req.object. '{actionname}' could be used if the default methods are not enough for any purpose like GET '/api/user/id/:id/rating' or GET '/api/user/activeOnes'.

Next steps
==========
* check if object urls work
* multidb with db caching
