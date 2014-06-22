define([
    'util/modelEndpointHandler',
    'node-promise'
], function (modelEndpointHandler, promise) {
    var Promise = promise.Promise;


    function checkPermissions(req, res, action) {
        var q = new Promise(),
            i = 0;

        // check if action has permissions.
        if (action.permissions && action.permissions.length > 0) {
            // check if token auth puts user object on req.user has permissions
            if (req.user && req.user.permissions) {
                // check if user has required permission by action
                for (i; i < req.user.permissions.length; i = i + 1) {
                    if (action.permissions.indexOf(req.user.permissions[i]) > -1) {
                        q.resolve();
                        break;
                    }
                }
            } else {
                q.reject();
            }
        } else {
            q.resolve();
        }

        return q;
    }

    return function (req, res, endpoint, isObjectRequest) {
        var action,
            params = req.params,
            method = req.method.toLowerCase(),
            actionList;

        if (!endpoint[params.version] || !endpoint[params.version][method]) {
            return res.send(404);
        }
        actionList = endpoint[params.version][method];

        // request has an objectid.
        if (isObjectRequest) {
            if (!params.objectid) {
                return res.send(404, 'objectid_not_found');
            }
            // if there is special action.
            if (params.action) {
                // check if action exists.
                if (!actionList[params.action]) {
                    return res.send(404, 'action_not_found');
                }
                action = actionList[params.action];
            } else {
                // load default object action 'object'.
                if (!actionList.object) {
                    return res.send(404, 'action_not_found');
                }
                action = actionList.object;
            }

            // check if user has correct permissions or it is a system user
            checkPermissions(req, res, action).then(function () {
                // try to find object of class model.
                modelEndpointHandler.initDb(req, res, params.classname, function (req, res, model) {
                    model.findById(params.objectid, function (err, object) {
                        if (err) {
                            return res.send(404, err);
                        }
                        if (!object) {
                            return res.send(404, 'object_not_found');
                        }
                        // put object on req.object.
                        req.object = object;
                        modelEndpointHandler.initDb(req, res, action.models, action.exec);
                    });
                });
            }, function () {
                return res.send(403, 'permission_denied');
            });
        } else {
            // if action is set
            if (params.action) {
                // check if actions exists.
                if (!actionList[params.action]) {
                    return res.send(404, 'action_not_found');
                }
                action = actionList[params.action];
            } else {
                // check if default class action '' exists.
                if (!actionList['']) {
                    return res.send(404, 'action_not_found');
                }
                action = actionList[''];
            }
            // check if user has correct permissions or it is a system user
            checkPermissions(req, res, action).then(function () {
                modelEndpointHandler.initDb(req, res, action.models, action.exec);
            }, function () {
                return res.send(403, 'permission_denied');
            });
        }
    };
});