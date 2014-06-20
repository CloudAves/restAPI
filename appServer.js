define([
    'express',
    'body-parser',
    'method-override',
    'errorhandler',
    'log',
    'appConfig',
    'util/actionHandler',
    'util/modelEndpointHandler',
    'middleware/authentication',
    'middleware/dbconnection',
], function (express, bodyParser, methodOverride, errorHandler, log, appConfig, actionHandler, modelEndpointHandler, authentication, dbconnection) {
    'use strict';

    var app = express();

    // load models and endpoints
    modelEndpointHandler.load().then(function (results) {
        var models = results[0],
            endpoints = results[1];

        // get called action
        function execAction(req, res) {
            var params = req.params,
                className = params.classname,
                version = params.version,
                isObject = params.objectid ? true : false,
                endpoint;

            // load model and endpoint by class
            if (version && className && models[className] && endpoints[className]) {
                endpoint = endpoints[className];

                return actionHandler(req, res, endpoint, isObject);
            }
            res.send(404, 'no_classname');
        }

        // Config
        app.use(bodyParser());
        app.use(methodOverride()); // HTTP PUT and DELETE support
        //app.use(express.static(path.join(application_root, 'public'))); // static file server
        app.use(errorHandler({ dumpExceptions: true, showStack: true })); // error stacks
        app.param('db', dbconnection); // use dbconnection cache
        app.use(authentication); // use authentication middleware

        // Launch server
        var server = app.listen(appConfig.port, function () {
            log.info('Listening on port %d', server.address().port);
        });

        // check if server runs
        app.get('/api', function (req, res) {
            res.send('api_online');
        });

        // set generic provided api class urls
        app.all('/api/:version/:db/:classname/:action?', execAction);

        // set generic provided api object urls
        app.all('/api/:version/:db/:classname/id/:objectid/:action?', execAction);

    }, log.error);
});