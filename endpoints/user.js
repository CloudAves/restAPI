define([
    'models/user'
], function (User) {
    return {
        post : {
            // register
            'register': {
                exec: function (req, res) {
                    var params = req.body,
                        user;

                    if (req.user) {
                        res.send(400, {
                            error: 'logged_in'
                        });
                    } else {
                        User.findOne({
                            $or: [{
                                username: params.username
                            }, {
                                email: params.email
                            }]
                        }, function (err, existingUser) {
                            if (err) {
                                res.send(400, err);
                            } else if (existingUser) {
                                res.send(400, {
                                    error: 'username_email_exists'
                                });
                            } else {
                                user = new User(params);
                                user.save(function (err) {
                                    if (err) {
                                        User.findOne({
                                            username: 'test'
                                        }, function (err, user) {
                                            console.log(user, err);
                                        });
                                        res.send(400, err);
                                    } else {
                                        res.send(200);
                                    }
                                });
                            }
                        });
                    }
                }
            }
        }
    };
});