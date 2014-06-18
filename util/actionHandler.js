define(function () {
    return function (req, res, model, endpoint, isObjectRequest) {
        var action,
            params = req.params,
            access = false,
            method = req.method.toLowerCase(),
            i = 0;

        if (!endpoint[method]) {
            return res.send(404);
        }

        // request has an objectid.
        if (isObjectRequest) {
            if (!params.objectId) {
                return res.send(404, 'objectid_not_found');
            }
            // try to find object of class model.
            model.findById(params.objectId, function (err, object) {
                if (err) {
                    res.send(404, 'object_not_found');
                } else {
                    // put object on req.object.
                    req.object = object;
                    // if there is special action.
                    if (params.action) {
                        // check if action exists.
                        if (endpoint[method][params.action]) {
                            action = endpoint[method][params.action];
                        } else {
                            res.send(404, 'action_not_found');
                        }
                    } else {
                        // load default object action 'object'.
                        if (endpoint[method].object) {
                            action = endpoint[method].object;
                        } else {
                            res.send(404, 'action_not_found');
                        }
                    }
                }
            });
        } else {
            // if action is set
            if (params.action) {
                // check if actions exists.
                if (endpoint[method][params.action]) {
                    action = endpoint[method][params.action];
                } else {
                    res.send(404, 'action_not_found');
                }
            } else {
                // check if default class action '' exists.
                if (endpoint[method]['']) {
                    action = endpoint[method][''];
                } else {
                    res.send(404, 'action_not_found');
                }
            }
        }
        // check if action has permissions.
        if (action.permissions && action.permissions.length > 0) {
            // check if token auth puts user object on req.user has permissions
            if (req.user && req.user.permissions) {
                // check if user has required permission by action
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
        // if user is allowed to do action
        if (access) {
            action.exec(req, res);
        } else {
            res.send(403, 'permission_denied');
        }
    };
});