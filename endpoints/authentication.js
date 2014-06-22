define([
    'jsonwebtoken',
    'crypto',
    'appConfig',
    'node-promise'
], function (jwt, crypto, appConfig, promise) {
    var Promise = promise.Promise;

    // store new authentication for user
    function generateAuthentication(user, Authentication) {
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

    this.login = {
        permissions: [],
        models: ['user', 'authentication'],
        exec: function (req, res, User, Authentication) {
            if (req.user) {
                return res.send(400, {
                    error: 'already_logged_in'
                });
            }
            if (!req.body.login || !req.body.password) {
                return res.send({
                    error: 'missing_login_or_password'
                });
            }
            User.findOne({
                $or: [{
                    email: req.body.login
                }, {
                    username: req.body.login
                }]
            }, function (err, user) {
                if (err) {
                    return res.send({
                        error: 'user_not_found'
                    });
                }
                if (!user) {
                    return res.send(400, {
                        error: 'user_not_exists'
                    });
                }
                if (!user.checkPassword(req.body.password)) {
                    return res.send({
                        error: 'invalid_login_password_combination'
                    });
                }
                generateAuthentication(user, Authentication).then(function (userData) {
                    res.send(userData);
                }, function (err) {
                    res.send(400, err);
                });
            });
        }
    };

    this.refresh = {
        permissions: [],
        models: ['authentication', 'user'],
        exec: function (req, res, Authentication, User) {
            var params = req.body;

            if (!params.accessToken || !params.refreshToken) {
                return res.send(400, {
                    'error': 'missing_access_or_refresh_token'
                });
            }

            Authentication.findOne({
                accessToken: params.accessToken
            }, function (err, authentication) {
                if (err) {
                    return res.send(err);
                }
                if (!authentication) {
                    return res.send(403);
                }
                if (authentication.refreshToken !== params.refreshToken) {
                    return res.send(400, {
                        error: 'invalid_refresh_token'
                    });
                }
                User.findById(authentication.userId, function (usererr, user) {
                    if (usererr) {
                        return res.send(400, usererr);
                    }
                    if (!user) {
                        return res.send(400, {
                            error: 'user_not_found'
                        });
                    }
                    authentication.remove(function (err) {
                        if (err) {
                            return res.send(400, err);
                        }
                        generateAuthentication(user, Authentication).then(function (userData) {
                            res.send(userData);
                        }, function (err) {
                            res.send(400, err);
                        });
                    });
                });
            });
        }
    };

    this.logout = {
        permissions: [appConfig.permissions.user],
        models: ['authentication'],
        exec: function (req, res, Authentication) {
            Authentication.findOne({
                accessToken: req.user.accessToken
            }, function (err, authentication) {
                if (err) {
                    return res.send(err);
                }
                if (!authentication) {
                    return res.send(403);
                }
                authentication.remove(function () {
                    res.send();
                });
            });
        }
    };

    return {
        v1: {
            post : {
                // /authentication
                'login': this.login,
                // refresh access token / authentication
                'refresh': this.refresh
            },
            // logout request
            get: {
                'logout': this.logout
            }
        }
    };
});