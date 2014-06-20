define([
    'node-promise',
    'fs',
    'log'
], function (promise, fs, log) {
    var Promise = promise.Promise;

    var endpoints = {},
        models = {};

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
    return {
        load: function () {
            var loader = new Promise(),
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
        },

        initDb: function (req, res, requiredModels, callback) {
            var i = 0,
                db = req.db,
                initModels = [];

            if (db && requiredModels) {
                for (i; i <= requiredModels.length; i++) {
                    if (models[requiredModels[i]] && models[requiredModels[i]].schema) {
                        initModels.push(db.model(requiredModels[i], models[requiredModels[i]].schema));
                    }
                }
            }
            initModels.unshift(res);
            initModels.unshift(req);

            callback.apply(undefined, initModels);
        }
    };
});