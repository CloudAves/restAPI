define([
    'express',
    'body-parser',
    'method-override',
    'errorhandler',
    'mongoose',
    'log',
    'appConfig',
    'databaseConfig',
    'fs',
    'node-promise',
    'util/actionHandler',
    'util/authenticationHandler'
], function (express, bodyParser, methodOverride, errorHandler, mongoose, log, appConfig, databaseConfig, fs, promise, actionHandler, authenticationHandler) {
    'use strict';

    var urlObjectSchema = '/api/:version/:classname/id/:objectid/:action?',
        urlClassSchema = '/api/:version/:classname/:action?',
        app = express(),
        Promise = promise.Promise,
        opt = {
            user: databaseConfig.username,
            pass: databaseConfig.password,
            auth: {
                authdb: databaseConfig.authdb
            }
        },
        connection = mongoose.connect(databaseConfig.host, databaseConfig.dbname, databaseConfig.port, opt);

    connection.connection.on('error', function (err) {
        log.error('connection error:', err.message);
    });
    connection.connection.once('open', function callback() {
        log.info("Connected to DB!");
    });

    // require model and enpoint
    function requireFile(file, endpoints, models) {
        var filePromise = new Promise(),
            nameWithoutExtension = file.substr(0, file.lastIndexOf('.'));

        log.info('Load ' + nameWithoutExtension + ' model and endpoints');

        require(['models/' + nameWithoutExtension, 'endpoints/' + nameWithoutExtension], function (model, endpoint) {
            endpoints[nameWithoutExtension] = endpoint;
            models[nameWithoutExtension] = model;
            filePromise.resolve();
        });

        return filePromise;
    }

    // load all models (in src/models) and the associated endpoint
    function loadModelEndpoints() {
        var loader = new Promise(),
            endpoints = {},
            models = {},
            tasks = [];

        fs.readdir('models', function (err, files) {
            var i = 0;
            if (err) {
                log.error('error during reading models');
                loader.reject();
            }
            for (i; i < files.length; i = i + 1) {
                tasks.push(requireFile(files[i], endpoints, models));
            }
            promise.all(tasks).then(function () {
                loader.resolve([models, endpoints]);
            }, loader.reject);
        });

        return loader;
    }

    // load models and endpoints
    loadModelEndpoints().then(function (results) {
        var models = results[0],
            endpoints = results[1];
        // get called action
        function execAction(req, res, isObjectRequest) {
            var params = req.params,
                className = params.classname,
                version = params.version,
                model,
                endpoint;

            // load model and endpoint by class
            if (version && className && models[className] && endpoints[className]) {
                model = models[className];
                endpoint = endpoints[className];

                return actionHandler(req, res, model, endpoint, isObjectRequest);
            }
            res.send(404, 'no_classname');
        }

        // Config
        app.use(bodyParser());
        app.use(methodOverride()); // HTTP PUT and DELETE support
        //app.use(express.static(path.join(application_root, 'public'))); // static file server
        app.use(errorHandler({ dumpExceptions: true, showStack: true })); // error stacks

        // Launch server
        var server = app.listen(appConfig.port, function () {
            log.info('Listening on port %d', server.address().port);
        });

        // check if server runs
        app.get('/api', function (req, res) {
            res.send('api_online');
        });

        // set generic provided api class urls
        app.all(urlClassSchema, authenticationHandler, function (req, res) {
            execAction(req, res, false);
        });

        // set generic provided api object urls
        app.all(urlObjectSchema, authenticationHandler, function (req, res) {
            execAction(req, res, true);
        });

    }, log.error);
});