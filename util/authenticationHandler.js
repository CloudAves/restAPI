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

        // if verify fails with -> invalid token
        try {
            // verify token
            jwt.verify(token, appConfig.secret, function (err, decoded) {
                if (err) {
                    // expired or invalid token -> check if it exists in database
                    Authentication.findOne({
                        accessToken: token
                    }, function (err, authentication) {
                        if (err) {
                            next();
                        } else {
                            // if it exists -> delete it
                            if (authentication) {
                                authentication.remove(function () {
                                    next();
                                });
                            } else {
                                next();
                            }
                        }
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