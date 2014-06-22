/*global define*/
/*jslint vars:true,nomen:true*/
define([
    'node-promise',
    'appConfig',
    'databaseConfig',
    'fs',
    'mkdirp',
    'util/modelEndpointHandler',
    'util/dbconnectionHandler',
    'log'
], function (promise, appConfig, databaseConfig, fs, mkdirp, meHandler, dbHandler, log) {
    'use strict';

    var Promise = promise.Promise;
    var DBS_FILE = 'static/' + databaseConfig.systemdb + '/dbs.json';

    var System = function () {
        var dbs = {};

        // load exitsing sites to system
        /*jslint stupid:true*/
        var init = function () {
            try {
                var filecontent = fs.readFileSync(DBS_FILE);

                dbs = JSON.parse(filecontent);
            } catch (ex) {
                mkdirp.sync('static/' + databaseConfig.systemdb + '/');
                fs.writeFileSync(DBS_FILE, JSON.stringify(dbs));
            }
        };
        /*jslint stupid:false*/

        init();

        fs.watch(DBS_FILE, function () {
            init();
        });

        var writeFile = function (promise) {
            fs.writeFile(DBS_FILE, JSON.stringify(dbs), function (err) {
                if (err) {
                    return promise.reject(err);
                }

                promise.resolve();
            });
        };

        this.createDB = function (dbname, name, active) {
            var createtask = new Promise();

            if (dbs[name]) {
                createtask.reject('db already exists');
            } else if (!name || !active) {
                createtask.reject('missing name or active flag');
            } else {
                mkdirp.sync('static/' + dbname + '/');
                dbs[dbname] = {
                    active: active,
                    name: name
                };
                writeFile(createtask);
            }
            return createtask;
        };

        this.deleteDB = function (name) {
            var deletetask = new Promise();
            if (!dbs[name]) {
                deletetask.reject('db does not exists');
            } else {
                dbs[name] = undefined;
                writeFile(deletetask);
            }
            return deletetask;
        };

        this.existsDB = function (name) {
            return dbs[name] !== undefined;
        };

        this.listSites = function () {
            return dbs;
        };

        this.createSystem = function (email, username, password) {
            var createtask = new Promise();
            dbHandler.get(databaseConfig.systemdb, function (db) {
                meHandler.load().then(function () {
                    meHandler.init(db, function (models) {
                        meHandler.clearModels(models).then(function () {
                            var User = models.User,
                                systemUser = new User({
                                    email: email,
                                    username: username,
                                    password: password,
                                    permissions: [appConfig.permissions.sysadmin]
                                });

                            systemUser.save(function (err) {
                                if (err) {
                                    createtask.reject(err);
                                } else {
                                    log.info('Finish: #System user created');
                                    createtask.resolve();
                                }
                            });
                        }, createtask.reject);
                    });
                }, createtask.reject);
            });

            return createtask;
        };
    };

    return new System();
});