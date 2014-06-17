define([
    'jsonwebtoken',
    'appConfig',
    'models/authentication'
], function (jwt, appConfig, Authentication) {
    return function (req, res, next) {
        var token,
            parts,
            scheme,
            credentials;

        // extract bearer token if it is set in headers authorization
        if (req.headers && req.headers.authorization) {
            parts = req.headers.authorization.split(' ');
            if (parts.length === 2) {
                scheme = parts[0];
                credentials = parts[1];

                if (/^Bearer$/i.test(scheme)) {
                    token = credentials;
                }
            } else {
                return next();
            }
        } else {
            return next();
        }

        // verify token
        jwt.verify(token, appConfig.secret, function (err, decoded) {
            if (err) {
                if (decoded && decoded.secret && decoded.userId) {
                    // expired or invalid token -> check if it exists in database
                    Authentication.findOne({
                        accessToken: token,
                        secret: decoded.secret,
                        userId: decoded.userId
                    }, function (err, authentication) {
                        if (err) {
                            next();
                        } else {
                            // if it exists -> delete it
                            authentication.remove(function () {
                                next();
                            });
                        }
                    });
                } else {
                    next();
                }
            } else {
                // everything works -> put decoded user on req.
                req.user = decoded;
                next();
            }
        });
    };
});