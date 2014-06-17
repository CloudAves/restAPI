define([
    'jsonwebtoken',
    'crypto',
    'models/authentication',
    'models/user',
    'appConfig'
], function (jwt, crypto, Authentication, User, appConfig) {
    return {
        post : {
            // /authentication
            'login': {
                permissions: [],
                exec: function (req, res) {
                    var userData,
                        accessToken,
                        refreshToken,
                        secret = crypto.randomBytes(128).toString('base64');

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
                                userData = {
                                    id: user.userId,
                                    username: user.username,
                                    email: user.email,
                                    created: user.created,
                                    permissions: user.permissions,
                                    secret: secret,
                                    expiresInMinutes: appConfig.tokenExpiresInMinutes,
                                    tokenType: 'Bearer'
                                };

                                accessToken = jwt.sign(userData, appConfig.secret, { expiresInMinutes: appConfig.tokenExpiresInMinutes });
                                userData.accessToken = accessToken;

                                refreshToken = jwt.sign(userData, appConfig.secret);
                                userData.refreshToken = refreshToken;

                                var authentication = new Authentication({
                                    userId: userData.id,
                                    secret: secret,
                                    accessToken: accessToken,
                                    refreshToken: refreshToken
                                });

                                authentication.save(function (err) {
                                    if (err) {
                                        res.json({
                                            error: 'failed_authentication'
                                        });
                                    } else {
                                        res.json(userData);
                                    }
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
        },
        'logout': {
            permissions: ['user'],
            exec: function (req, res) {
                var accessToken = req.get('Authorization');


            }
        }
    };
});