/*global define*/
/*jslint vars:true*/
define([
    'util/cacheHandler',
    'mongoose',
    'databaseConfig',
    'log'
], function (Cache, mongoose, databaseConfig, log) {
    'use strict';
    var dbconcache = new Cache(databaseConfig.maxConnections,
        function resolve(dbname, callback) {

            var opt = {
                user: databaseConfig.username,
                pass: databaseConfig.password,
                auth: {
                    authdb: databaseConfig.authdb
                }
            };

            var connection = mongoose.createConnection(databaseConfig.host, dbname, databaseConfig.port, opt);

            connection.on('open', function () {
                callback(connection);
            });

            connection.on('error', function (err) {
                log.error(err);
            });
        },
        function dispose(db) {
            db.close();
        });

    return dbconcache;
});