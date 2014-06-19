define([
    'jsonwebtoken',
    'crypto',
    'models/authentication',
    'models/user',
    'appConfig',
    'node-promise'
], function (jwt, crypto, Authentication, User, appConfig, promise) {
    var Promise = promise.Promise;

    // store new authentication for user
    function generateAuthentication(user) {
        var $q = new Promise(),
            secret = crypto.randomBytes(128).toString('base64'),
            userData = {
                id: user.userId || user.id,
                username: user.username,
                email: user.email,
                created: user.created,
                permissions: user.permissions,
                secret: secret,
                expiresInMinutes: appConfig.tokenExpiresInMinutes,
                tokenType: 'Bearer'
            },
            accessToken,
            refreshToken,
            auth;

        accessToken = jwt.sign(userData, appConfig.secret, { expiresInMinutes: appConfig.tokenExpiresInMinutes });
        userData.accessToken = accessToken;

        refreshToken = jwt.sign(userData, appConfig.secret);
        userData.refreshToken = refreshToken;

        auth = new Authentication({
            userId: userData.id,
            secret: secret,
            accessToken: accessToken,
            refreshToken: refreshToken
        });

        auth.save(function (err) {
            if (err) {
                $q.reject(err);
            } else {
                $q.resolve(userData);
            }
        });

        return $q;
    }

    return {
        post : {
            // /authentication
            'login': {
                permissions: [],
                exec: function (req, res) {
                    if (req.user) {
                        return res.send(400, {
                            error: 'already_logged_in'
                        });
                    }
                    if (req.body.login && req.body.password) {
                        User.findOne({
                            $or: [{
                                email: req.body.login
                            }, {
                                username: req.body.login
                            }]
                        }, function (err, user) {
                            if (err) {
                                res.json({
                                    error: 'user_not_found'
                                });
                            } else if (user.checkPassword(req.body.password)) {

                                generateAuthentication(user).then(function (userData) {
                                    res.json(userData);
                                }, function (err) {
                                    res.json(400, err);
                                });
                            } else {
                                res.json({
                                    error: 'invalid_login_password_combination'
                                });
                            }
                        });
                    } else {
                        res.json({
                            error: 'missing_login_or_password'
                        });
                    }
                }
            },
            // refresh access token / authentication
            'refresh': {
                permissions: ['user'],
                exec: function (req, res) {
                    Authentication.findOne({
                        accessToken: req.user.accessToken,
                        userId: req.user.id,
                        secret: req.user.secret
                    }, function (err, authentication) {
                        if (err) {
                            res.send(err);
                        } else {
                            if (authentication && authentication.refreshToken) {
                                if (!req.body.refreshToken) {
                                    return res.json(400, {
                                        error: 'missing_refresh_token'
                                    });
                                }
                                if (authentication.refreshToken === req.body.refreshToken) {
                                    authentication.remove(function (err) {
                                        if (err) {
                                            res.send(400, err);
                                        } else {
                                            generateAuthentication(req.user).then(function (userData) {
                                                res.json(userData);
                                            }, function (err) {
                                                res.json(400, err);
                                            });
                                        }
                                    });
                                } else {
                                    res.send(400, {
                                        error: 'wrong_refresh_token'
                                    });
                                }
                            } else {
                                res.json(403);
                            }
                        }
                    });
                }
            }
        },
        // logout request
        get: {
            'logout': {
                permissions: ['user'],
                exec: function (req, res) {
                    Authentication.findOne({
                        accessToken: req.user.accessToken
                    }, function (err, authentication) {
                        if (err) {
                            res.send(err);
                        } else {
                            if (!authentication) {
                                return res.send(403);
                            }
                            authentication.remove(function () {
                                res.send();
                            });
                        }
                    });
                }
            }
        }
    };
});