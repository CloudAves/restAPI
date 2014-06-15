define([
    'models/user'
], function (User) {
    return {
        get: {
            // user
            '': {
                exec: function (req, res) {

                }
            },
            // user/:id
            'object': {
                permission: ['admin', 'user'],
                exec: function (req, res) {
                }
            }
        },
        post : {
            // user
            '': {

            },
            // user/:id
            'object': {

            }
        },
        put: {
            // user
            '': {

            },
            // user/:id
            'object': {

            }
        },
        delete: {
            // user/:id
            'object': {

            }
        }
    };
});