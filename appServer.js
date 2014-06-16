define([
    'express',
    'path',
    'mongoose',
    'log',
    'appConfig',
    'databaseConfig',
    'fs',
    'node-promise',
    'express-jwt'
], function (express, path, mongoose, log, appConfig, databaseConfig, fs, promise, expressJwt) {
    'use strict';

    var urlSchema = '/api/:classname?/:objectid?/:action?',
        application_root = __dirname,
        app = express.createServer(),
        Promise = promise.Promise,
        secret = 'efskj43dsakwesdo!345as?09u2#*~23423(';

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

        require('models/' + nameWithoutExtension, 'endpoints/' + nameWithoutExtension, function (model, endpoint) {
            endpoints[nameWithoutExtension] = endpoint;
            models[nameWithoutExtension] = model;
            filePromise.resolve();
        });
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
        function execAction(req, res) {
            var params = req.params,
                className = params.classname,
                model,
                endpoint,
                action,
                access = false,
                i = 0;

            if (className && models[className] && endpoints[className]) {
                model = models[className];
                endpoint = endpoints[className];

                if (params.objectId) {
                    model.findById(params.objectId, function (err, object) {
                        if (err) {
                            res.send(404, 'object_not_found');
                        } else {
                            req.object = object;
                            if (params.action) {
                                if (endpoint[req.method][params.action]) {
                                    action = endpoint[req.method][params.action];
                                } else {
                                    res.send(404, 'action_not_found');
                                }
                            } else {
                                if (endpoint[req.method].object) {
                                    action = endpoint[req.method].object;
                                } else {
                                    res.send(404, 'action_not_found');
                                }
                            }
                        }
                    });
                } else {
                    if (params.action) {
                        if (endpoint[req.method][params.action]) {
                            action = endpoint[req.method][params.action];
                        } else {
                            res.send(404, 'action_not_found');
                        }
                    } else {
                        if (endpoint[req.method]['']) {
                            action = endpoint[req.method][''];
                        } else {
                            res.send(404, 'action_not_found');
                        }
                    }
                }
                if (action.permissions && action.permissions.length > 0) {
                    if (req.user && req.user.permissions) {
                        for (i; i < req.user.permissions.length; i = i + 1) {
                            if (action.permissions.indexOf(req.user.permissions[i]) > -1) {
                                access = true;
                                break;
                            }
                        }
                    }
                } else {
                    access = true;
                }
                if (access) {
                    action(req, res);
                } else {
                    res.send(403, {
                        error: 'permission_denied'
                    });
                }
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

            // authentication
            app.use(function (req, res, next) {
                // check authentication -> and put user object on req.user else undefined
            });

            app.use(function(req, res, next) {
                res.status(404);
                log.debug('Not found URL: %s', req.url);
                res.send({ error: 'not_found' });
                return;
            });

            app.use(function(err, req, res, next) {
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
            res.send('API is running');
        });

        // set generic provided api urls
        app.all(urlSchema, expressJwt({secret: secret}), execAction);
    });
});