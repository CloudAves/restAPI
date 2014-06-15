/*global define*/
/*jslint vars:true*/
define([
    'winston',
    'config'
], function (winston, config) {
    'use strict';

    var logger = new winston.Logger({
        transports: [new winston.transports.Console({
            prettyPrint: true,
            handleExceptions: true,
            level: config.webserver.logLevel
        })]
    });

    return logger;
});