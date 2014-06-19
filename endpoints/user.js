define([
    'models/user'
], function (User) {

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
                register: this.register
            }
        }
    };
});