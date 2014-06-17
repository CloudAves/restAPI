define([
    'mongoose',
    'crypto'
], function (mongoose, crypto) {
    'use strict';

    var Schema = mongoose.Schema;

    // User
    var User = new Schema({
        username: {
            type: String,
            unique: true,
            required: true
        },
        email: {
            type: String,
            unique: true,
            required: true
        },
        hashedPassword: {
            type: String,
            required: true
        },
        salt: {
            type: String,
            required: true
        },
        created: {
            type: Date,
            'default': Date.now
        },
        permissions: {
            type: [String],
            'default': []
        },
        resetpassword: {
            type: String,
            'default': null
        }
    });

    User.methods.encryptPassword = function (password) {
        return crypto.pbkdf2Sync(password, this.salt, 10000, 512);
    };

    User.virtual('userId')
        .get(function () {
            return this.id;
        });

    User.virtual('password')
        .set(function (password) {
            this._plainPassword = password;
            this.salt = crypto.randomBytes(128).toString('base64');
            this.hashedPassword = this.encryptPassword(password);
        })
        .get(function () { return this._plainPassword; });


    User.methods.checkPassword = function (password) {
        return this.encryptPassword(password) === this.hashedPassword;
    };

    var UserModel = mongoose.model('User', User);

    return UserModel;
});