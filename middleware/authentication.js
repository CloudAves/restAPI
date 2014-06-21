define([
    'jsonwebtoken',
    'appConfig',
    'util/modelEndpointHandler'
], function (jwt, appConfig, modelEndpointHandler) {
    return function (req, res, next) {
        var token,
            parts,
            scheme,
            credentials;

        // extract bearer token if it is set in headers authorization
        if (!req.headers || !req.headers.authorization) {
            return next();
        }
        parts = req.headers.authorization.split(' ');
        if (parts.length !== 2) {
            return next();
        }
        scheme = parts[0];
        credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
            token = credentials;
        }

        // if verify fails with -> invalid token
        try {
            // verify token
            jwt.verify(token, appConfig.secret, function (err, decoded) {
                if (err) {
                    modelEndpointHandler.initDB(req, res, ['authentication'], function (req, res, Authentication) {
                        // expired or invalid token -> check if it exists in database
                        Authentication.findOne({
                            accessToken: token
                        }, function (err, authentication) {
                            if (err) {
                                return next();
                            }
                            // if it exists -> delete it
                            if (!authentication) {
                                return next();
                            }
                            authentication.remove(function () {
                                next();
                            });
                        });
                    });
                } else {
                    // everything works -> put decoded user on req.
                    req.user = decoded;
                    req.user.accessToken = token;
                    next();
                }
            });
        } catch (e) {
            res.send(400, {
                error: 'invalid_access_token'
            });
        }
    };
});