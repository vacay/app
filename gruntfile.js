/* global module, require */

var modRewrite = require('connect-modrewrite');

module.exports = function(grunt) {

    grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),

	clean: {
	    options: {
		force: true
	    },
	    index: {
		src: ['tmp/**/*']
	    }
	},

	/********************* STYLE *********************/
	stylus: {
	    options: {
		compress: true,
		'include css': true
	    },
	    compile: {
		files: {
		    'tmp/app.css': 'src/css/*.styl'
		}
	    }
	},
	cssmin: {
	    compress: {
		files: {
		    'tmp/app.css': 'tmp/app.css'
		}
	    }
	},
	staticinline: {
	    main: {
		files: {
		    'tmp/index.html': 'tmp/index.html'
		}
	    }
	},

	/********************* JAVASCRIPT *********************/
	concat: {
	    vendor: {
		files: {
		    'tmp/vendor.js': [
			'bower_components/localforage/dist/localforage.nopromises.min.js',
			'bower_components/async/lib/async.js',

			'bower_components/page/page.js',
			'bower_components/soundmanager/script/soundmanager2-nodebug-jsmin.js',
			'bower_components/youtubemanager2/lib/youtubemanager.js',
			'bower_components/identiconjs/identicon.js',
			'bower_components/identiconjs/pnglib.js',			
			'bower_components/crypto-js/rollups/md5.js',
			'bower_components/doT/doT.min.js',
			'bower_components/socket.io-client/socket.io.js',
			'bower_components/dragula.js/dist/dragula.js',
			'bower_components/fastclick/lib/fastclick.js',
			'bower_components/mousetrap/mousetrap.min.js',
			'bower_components/showdown/dist/showdown.min.js',
			'bower_components/ua-parser-js/dist/ua-parser.min.js',
			'src/request.js',
			'src/raf.js',
			'src/element.js',
			'src/location.js',
			'src/platform.js',
			'src/modal.js',
			'src/view.js',
			'src/log.js'
		    ]
		}
	    },
	    production: {
		files: {
		    'tmp/app.js' : [
			'config/production.js',
			'tmp/app.js'
		    ]
		}
	    },
	    development: {
		files: {
		    'tmp/app.js' : [
			'config/development.js',
			'tmp/app.js'
		    ]
		}
	    },
	    js: {
		files: {
		    'tmp/app.js' : [ 'src/offline/*.js', 'src/js/**/*.js' ]
		}
	    },
	    index: {
		files: {
		    'tmp/app.js' : [
			'tmp/app.js',
			'src/index.js'
		    ]
		}
	    },
	    desktop: {
		files: {
		    'tmp/desktop.js': [ 'src/desktop/*.js' ]
		}
	    },
	    mobile: {
		files: {
		    'tmp/mobile.js': [ 'src/mobile/*.js' ]
		}
	    }
	},
	uglify: {
	    options: {
		beautify: {
		    ascii_only: true,
		    inline_script: true
		}
	    },
	    vendor: {
		files: {
		    'tmp/vendor.js': ['tmp/vendor.js']
		}
	    },
	    js: {
		files: {
		    'tmp/app.js': ['tmp/app.js']
		}
	    }
	},
	
	inline: {
	    index: {
		src: [ 'tmp/index.html' ]
	    }
	},
	jade: {
	    index: {
		files: [{
		    'tmp/index.html': ['src/html/index.jade']
		}]
	    },
	    partials: {
		files: [{
		    expand: true,
		    src: ['**/*.jade'],
		    dest: 'tmp/',
		    cwd: 'src/html/partials/',
		    ext: '.html'
		}]
	    }
	},
	inline_angular_templates: {
	    index: {
		options: {
		    base: 'tmp',
		    prefix: '/',
		    selector: 'body',
		    method: 'prepend'
		},
		files: {
		    'tmp/index.html': ['tmp/**/*.html', '!tmp/index.html']
		}
	    }
	},	
	htmlmin: {
	    index: {
		options: {
		    collapseWhitespace: true,
		    removeComments: true
		},
		files: {
		    'tmp/index.html': 'tmp/index.html'
		}
	    }
	},
	copy: {
	    index: {
		files: [{
		    expand: true,
		    flatten: true,
		    src: 'tmp/index.html',
		    dest: 'www/'
		}]
	    },
	    desktop: {
		files: [{
		    expand: true,
		    flatten: true,
		    src: 'tmp/index.html',
		    dest: 'desktop/'
		}, {
		    expand: true,
		    flatten: true,
		    src: 'src/worker.js',
		    dest: 'desktop/'
		}, {
		    expand: true,
		    flatten: true,
		    src: 'tmp/desktop.js',
		    dest: 'desktop/'
		}]
	    },
	    mobile: {
		files: [{
		    expand: true,
		    flatten: true,
		    src: 'tmp/mobile.js',
		    dest: 'www/'
		}]
	    },
	    hero: {
		files: [{
		    expand: true,
		    flatten: true,
		    src: 'resources/mobile/hero.gif',
		    dest: 'www/'
		}]
	    },
	    icon: {
		files: [{
		    expand: true,
		    flatten: true,
		    src: 'resources/icon.png',
		    dest: 'www/'
		}]
	    }
	},

	watch: {
	    index: {
		files: [
		    'gruntfile.js',
		    'config/**/*.js',
		    'src/html/**/*.jade',
		    'src/**/*.js',
		    'bower_components/**/*',
		    'src/css/**/*'
		],
		tasks: ['default']
	    }
	},

	jshint: {
	    options: {
		curly: false,
		undef: true,
		unused: true,
		bitwise: true,
		freeze: true,
		smarttabs: true,
		immed: true,
		latedef: true,
		newcap: true,
		noempty: true,
		nonew: true,
		laxbreak: true,
		trailing: true,
		forin: true,
		eqeqeq: true,
		eqnull: true,
		force: true,
		quotmark: 'single',
		expr: true
	    },
	    main: [
		'src/**/*.js'
	    ]
	},

	/************************ BUILD ***********************/
	cordovacli: {
	    build: {
		options: {
		    id: 'io.vacay',
		    name: 'vacay',
		    path: './',
		    command: 'build',
		    platforms: [ 'ios'/*, 'android'*/ ]
		}
	    }
	},

	connect: {
	    server: {
		options: {
		    keepalive: true,
		    debug: true,
		    port: 9000,
		    base: 'www',
		    open: {
			target: 'http://localhost:9000',
			appName: 'Google Chrome'
		    },
		    middleware: function (connect, options) {
			var middlewares = [];

			middlewares.push(modRewrite([
			    '!\\.ico|\\.jpg|\\.css|\\.js|\\.png|\\woff|\\ttf|\\.swf$ /index.html'
			]));

			if (!Array.isArray(options.base)) {
			    options.base = [options.base];
			}

			var directory = options.directory || options.base[options.base.length - 1];
			options.base.forEach(function (base) {
			    middlewares.push(connect.static(base));
			});

			middlewares.push(connect.directory(directory));

			return middlewares;
		    }
		}
	    }
	}	
    });

    grunt.registerTask('base', [
	'clean',
	'stylus',
	'cssmin',
	'concat:vendor',
	'concat:js',
	'concat:mobile',
	'concat:desktop'
    ]);

    grunt.registerTask('after', [
	'concat:index',
	'jade:partials',
	'inline_angular_templates',
	'staticinline',
	'inline',
	'htmlmin',
	'copy'
    ]);

    grunt.registerTask('default', [
	'base',

	'concat:production',
	'jade:index',

	'after'
    ]);

    grunt.registerTask('web', [
	'base',

	'concat:production',
	'jade:index',

	'uglify',
	'after'
    ]);

    grunt.loadNpmTasks('grunt-contrib-clean');    
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-inline');
    grunt.loadNpmTasks('grunt-static-inline');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-inline-angular-templates');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-cordovacli');

};	
