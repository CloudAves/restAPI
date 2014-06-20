/*global define*/
/*jslint vars:true*/
define([
    'util/dbconnectionHandler',
    'log'
], function (dbconnectionHandler, log) {
    'use strict';
    return function (req, res, next, db) {

        if (db) {
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
