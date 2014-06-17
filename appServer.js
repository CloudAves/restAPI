define([
    'express',
    'path',
    'mongoose',
    'log',
    'appConfig',
    'databaseConfig',
    'fs',
    'node-promise',
    'util/actionHandler',
    'util/authenticationHandler'
], function (express, path, mongoose, log, appConfig, databaseConfig, fs, promise, actionHandler, authenticationHandler) {
    'use strict';

    var urlObjectSchema = '/api/:classname/id/:objectid/:action?',
        urlClassSchema = '/api/:classname/:action?',
        application_root = __dirname,
        app = express.createServer(),
        Promise = promise.Promise;

    // Database
    mongoose.connect('mongodb://localhost/' + databaseConfig.dbname);
    var db = mongoose.connection;

    db.on('error', function (err) {
        log.error('connection error:', err.message);
    });
    db.once('open', function callback() {
        log.info("Connected to DB!");
    });

    // require model and enpoint
    function requireFile(file, endpoints, models) {
        var filePromise = new Promise(),
            nameWithoutExtension = file.substr(0, file.lastIndexOf('.'));

        log.info('Load' + nameWithoutExtension + 'model and endpoints');

        try {
            require('models/' + nameWithoutExtension, 'endpoints/' + nameWithoutExtension, function (model, endpoint) {
                endpoints[nameWithoutExtension] = endpoint;
                models[nameWithoutExtension] = model;
                filePromise.resolve();
            });
        } catch (e) {
            log.error(e);
            filePromise.reject();
        }

        return filePromise;
    }

    // load all models (in src/models) and the associated endpoint
    function loadModelEndpoints() {
        var loader = new Promise(),
            endpoints = {},
            models = {},
            tasks = [];

        fs.readDirSync('src/models', function (err, files) {
            var i = 0;

            if (err) {
                log.error('error during reading models');
                loader.reject();
            }
            for (i; i < files.length; i = i + 1) {
                tasks.push(requireFile(files[i], endpoints, models));
            }
            promise.all(tasks).then(function () {
                loader.resolve(models, endpoints);
            }, loader.reject);
        });

        return loader;
    }

    // load models and endpoints
    loadModelEndpoints.then(function (models, endpoints) {
        // get called action
        function execAction(req, res, isObjectRequest) {
            var params = req.params,
                className = params.classname,
                model,
                endpoint;

            // load model and endpoint by class
            if (className && models[className] && endpoints[className]) {
                model = models[className];
                endpoint = endpoints[className];

                actionHandler(req, res, model, endpoint, isObjectRequest);
            } else {
                res.send(404, 'no_classname');
            }
        }

        // Config
        app.configure(function () {
            app.use(express.bodyParser()); // JSON parsing
            app.use(express.methodOverride()); // HTTP PUT and DELETE support
            app.use(app.router); // simple route management
            app.use(express.static(path.join(application_root, 'public'))); // static file server
            app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); // error stacks

            app.use(function (req, res, next) {
                res.status(404);
                log.debug('Not found URL: %s', req.url);
                res.send({ error: 'not_found' });
                return;
            });

            app.use(function (err, req, res, next) {
                res.status(err.status || 500);
                log.error('Internal error(%d): %s', res.statusCode, err.message);
                res.send({ error: err.message });
                return;
            });
        });

        // Launch server
        app.listen(appConfig.port, function () {
            log.info('app started listening');
        });

        // check if server runs
        app.get('/api', function (req, res) {
            res.send('api_online');
        });

        // set generic provided api object urls
        app.all(urlObjectSchema, authenticationHandler, function (req, res) {
            execAction(req, res, true);
        });

        // set generic provided api class urls
        app.all(urlClassSchema, authenticationHandler, execAction);
    }, log.error);
});