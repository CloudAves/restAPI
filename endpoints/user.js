define([
    'models/user'
], function (User) {

    // get current logged in user
    this.account = {
        permissions: ['user'],
        exec: function (req, res) {
            if (!req.user) {
                return res.send(403);
            }
            res.send(req.user);
        }
    };

    // get user object
    this.object = {
        permissions: [],
        exec: function (req, res) {
            if (!req.object) {
                return res.send(403);
            }
            res.send(req.object);
        }
    };

    // get username
    this.username = {
        permissions: [],
        exec: function (req, res) {
            var object = req.object;
            res.send({
                name: object.username
            });
        }
    };

    // get userlist
    this.userlist = {
        permissions: [],
        exec: function (req, res) {
            User.find({}, function (err, users) {
                if (err) {
                    return res.send(400, err);
                }
                res.send(users);
            });
        }
    };

    // register
    this.register = {
        exec: function (req, res) {
            var params = req.body,
                user;

            if (req.user) {
                return res.send(400, {
                    error: 'already_logged_in'
                });
            }
            User.findOne({
                $or: [{
                    username: params.username
                }, {
                    email: params.email
                }]
            }, function (err, existingUser) {
                if (err) {
                    return res.send(400, err);
                }
                if (existingUser) {
                    return res.send(400, {
                        error: 'username_email_exists'
                    });
                }
                user = new User(params);

                user.save(function (err) {
                    if (err) {
                        return res.send(400, err);
                    }
                    return res.send(200);
                });
            });
        }
    };

    return {
        v1 : {
            post : {
                'register': this.register
            },
            get: {
                'account': this.account,
                'object': this.object,
                'username': this.username,
                '': this.userlist
            }
        }
    };
});