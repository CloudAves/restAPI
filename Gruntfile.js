/*global module, grunt, require:true*/
/*jslint vars:true*/
/* istanbul ignore next */
module.exports = function (grunt) {
    'use strict';

    require = require('./config/require');
    var dbconfig = require('databaseConfig'),
        System = require('util/system');

    var DBPATH = dbconfig.dbpath;
    grunt.file.mkdir(DBPATH);

    var db = grunt.option('target') ||  'test';

    var reporter = grunt.option('reporter');

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-istanbul');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.initConfig({
        mochaTest: {
            test: {
                options: {
                    timeout: 10000,
                    reporter: reporter || 'spec'
                },
                src: ['src/*/test/*.js', 'src/*/test/*/*.js']
            }
        },

        exec: {
            createMongoUsers: {
                command: 'sudo mongo ' + dbconfig.host + ':' + dbconfig.port + ' --eval "var host=\'' + dbconfig.host + '\', port=\'' + dbconfig.port + '\', admin=\'' + dbconfig.admin + '\', adminpassword=\'' + dbconfig.adminpassword + '\', user=\'' + dbconfig.username + '\', password=\'' + dbconfig.password + '\';" util/createmongouser.js'
            },

            killDB: {
                command: 'sudo killall mongod || true'
            },

            startFirstDB: {
                command: 'sudo mongod --dbpath=' + DBPATH + ' --port=' + dbconfig.port + ' &'
            },

            startDB: {
                command: 'sudo mongod --dbpath=' + DBPATH + ' --port=' + dbconfig.port + ' --auth &',
                stdout: true,
                stderr: true
            },

            startNode: {
                command: 'node index'
            },

            cover: {
                command: 'istanbul cover grunt tests --hook-run-in-context'
            },

            doc: {
                command: 'jsdoc endpoints/*.js -d docs'
            }
        },

        jshint: {
            server: {
                src: ['**/*.js'],
                options: {
                    ignores: ['node_modules/**', 'doc/**', 'static/**', 'coverage/**']
                }
            }

        },

        jsdoc : {
            dist : {
                src: ['endpoints/*.js'],
                options: {
                    destination: 'doc'
                }
            }
        },

        clean: {
            db: ['static/' + db],
            mongo: [DBPATH]
        }
    });

    /*jslint regexp:true*/
    var buildParams = function (flags) {
        var params = {};

        flags.forEach(function (flag) {
            var truematch = /--([^\s=]+)$/.exec(flag);

            if (truematch) {
                params[truematch[1]] = true;
                return;
            }

            var nomatch = /--no-([^\s=]+)$/.exec(flag);

            if (nomatch) {
                params[nomatch[1]] = false;
                return;
            }

            var match = /--([^\s=]+)=([^\s=]+)/.exec(flag);
            if (match) {
                params[match[1]] = match[2];
            }
        });

        return params;
    };
    /*jslint regexp:false*/

    var reinstall = function () {
        var flags = grunt.option.flags();
        var params = buildParams(flags);

        var done = this.async();
        var init = require('util/democontent');

        var database = params.target || db;

        init(database, params).then(function () {
            done();
        }, grunt.log.error);
    };

    var createDB = function () {
        var flags = grunt.option.flags();
        var params = buildParams(flags);

        var database = params.target || db;
        var name = params.name || 'Test';

        var done = this.async();
        if (System.existsDB(db)) {
            return done();
        }
        System.createDB(database, name, true).then(function () {
            done();
        }, grunt.log.error);
    };

    var deleteDB = function () {
        var flags = grunt.option.flags();
        var params = buildParams(flags);

        var database = params.target || db;
        var done = this.async();
        System.deleteDB(database).then(function () {
            done();
        }, grunt.log.error);
    };

    var createSystem = function () {
        var flags = grunt.option.flags();
        var params = buildParams(flags);

        params.username = params.username || 'test';
        params.email = params.email || 'test@test.com';
        params.password = params.password || '1234';

        var done = this.async();
        System.createSystem(params.email, params.username, params.password).then(function () {
            done();
        }, grunt.log.error);
    };

    grunt.registerTask('initSystem', createSystem);
    grunt.registerTask('createcontent', reinstall);
    grunt.registerTask('reinstall', ['createDB', 'clean:db', 'createcontent']);
    grunt.registerTask('start', ['exec:startNode']);
    grunt.registerTask('tests', ['mochaTest']);
    grunt.registerTask('default', 'start');

    grunt.registerTask('createDB', createDB);
    grunt.registerTask('deleteDB', deleteDB);
};