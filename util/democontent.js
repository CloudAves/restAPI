/*global define, require*/
/*jslint node:true, vars:true,nomen:true*/
define([
    'node-promise',
    'appConfig',
    'util/modelEndpointHandler',
    'util/dbconnectionHandler',
    'log'
], function (promise, appConfig, meHandler, dbHandler, log) {
    'use strict';
    var Promise = promise.Promise;

    return function (database) {
        var reinstalltask = new Promise();

        dbHandler.get(database, function (db) {
            meHandler.load().then(function () {
                meHandler.init(db, function (models) {
                    meHandler.clearModels(models).then(function () {
                        var User = models.User,
                            user = new User({
                                username: 'test',
                                email: 'test@test.com',
                                password: '1234'
                            }),
                            admin = new User({
                                username: 'admin',
                                email: 'admin@test.com',
                                password: '1234',
                                permissions: [appConfig.permissions.admin]
                            });
                        user.save(function (err, user) {
                            if (err) {
                                return reinstalltask.reject(err);
                            }
                            admin.save(function (err) {
                                if (err) {
                                    return reinstalltask.reject(err);
                                }
                                log.info('# Finish: User and Admin created');
                                reinstalltask.resolve();
                            }, reinstalltask.reject);
                        }, reinstalltask.reject);
                    }, reinstalltask.reject);
                });
            }, reinstalltask.reject);
        }, reinstalltask.reject);

        return reinstalltask;
    };
});
