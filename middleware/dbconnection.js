/*global define*/
/*jslint vars:true*/
define([
    'util/dbconnectionHandler',
    'log',
    'util/system',
    'databaseConfig'
], function (dbconnectionHandler, log, System, databaseConfig) {
    'use strict';
    return function (req, res, next, db) {
        if (db) {
            if (db !== databaseConfig.systemdb && !System.existsDB(db)) {
                return res.send(400, {
                    error: 'database_not_exists'
                });
            }
            dbconnectionHandler.get(db, function (db) {
                req.db = db;
                log.info('Using database ' + req.db.name);
                next();
            });
        } else {
            next();
        }
    };
});
