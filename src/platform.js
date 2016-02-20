/* global window, document, navigator, DocumentTouch */
(function (root, factory) {

    root.Platform = factory(root);

})(this, function () {

    'use strict';

    var platformName = null, // just the name, like iOS or Android
	platformVersion = null, // a float of the major and minor, like 7.1
	readyCallbacks = [];

    var platform = {

	isReady: false,
	isFullScreen: false,
	platforms: null,
	grade: null,
	ua: navigator.userAgent,

	ready: function(cb) {
	    // run through tasks to complete now that the device is ready
	    if(this.isReady) {
		cb();
	    } else {
		// the platform isn't ready yet, add it to this array
		// which will be called once the platform is ready
		readyCallbacks.push(cb);
	    }
	},

	detect: function() {
	    platform._checkPlatforms();

	    // only add to the body class if we got platform info
	    for(var i = 0; i < platform.platforms.length; i++) {
		document.body.classList.add('platform-' + platform.platforms[i]);
	    }
	    document.body.classList.add('grade-' + platform.grade);
	    document.body.classList.toggle('mobile', this.isMobile());
	    document.body.classList.add(this.isTouchDevice() ? 'touch' : 'mouse');	    
	},

	device: function() {
	    if(window.device) return window.device;
	    return {};
	},

	_checkPlatforms: function() {
	    this.platforms = [];
	    this.grade = 'a';

	    if(this.isCordova()) this.platforms.push('cordova');
	    if(this.isIPad()) this.platforms.push('ipad');

	    var platform = this.platform();
	    if (platform) {
		this.platforms.push(platform);

		var version = this.version();
		if (version) {
		    var v = version.toString();
		    if (v.indexOf('.') > 0) {
			v = v.replace('.', '_');
		    } else {
			v += '_0';
		    }
		    this.platforms.push(platform + v.split('_')[0]);
		    this.platforms.push(platform + v);

		    if(this.isAndroid() && version < 4.4) {
			this.grade = (version < 4 ? 'c' : 'b');
		    }
		}
	    }
	},

	isChrome: function() {
	    return !!window.chrome;
	},

	isCordova: function() {
	    return !(!window.cordova && !window.PhoneGap && !window.phonegap);
	},

	isIPad: function() {
	    return this.ua.toLowerCase().indexOf('ipad') >= 0;
	},

	isIOS: function() {
	    return this.is('ios');
	},

	isAndroid: function() {
	    return this.is('android');
	},

	isMobile: function() {
	    return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1);
	},

	isNodeWebkit: function() {
	    return this.ua.indexOf('NodeWebkit') > -1;
	},

	isNative: function() {
	    return this.isNodeWebkit() || this.isCordova();
	},

	isTouchDevice: function() {
	    return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
	},

	// Check if the platform is the one detected by cordova
	is: function(type) {
	    type = type.toLowerCase();
	    // check if it has an array of platforms
	    if(this.platforms) {
		for(var x = 0; x < this.platforms.length; x++) {
		    if(this.platforms[x] === type) return true;
		}
	    }
	    // exact match
	    var pName = this.platform();
	    if(pName) {
		return pName === type.toLowerCase();
	    }

	    // A quick hack for to check userAgent
	    return this.ua.toLowerCase().indexOf(type) >= 0;
	},	

	platform: function() {
	    // singleton to get the platform name
	    if(platformName === null) this.setPlatform(this.device().platform);
	    return platformName;
	},

	setPlatform: function(n) {
	    if(typeof n !== 'undefined' && n !== null && n.length) {
		platformName = n.toLowerCase();
	    } else if(this.ua.indexOf('Android') > 0) {
		platformName = 'android';
	    } else if(this.ua.indexOf('iPhone') > -1 || this.ua.indexOf('iPad') > -1 || this.ua.indexOf('iPod') > -1) {
		platformName = 'ios';
	    } else if (this.ua.indexOf('NodeWebkit') > -1) {
		platformName = 'nodewebkit';
	    } else {
		platformName = '';
	    }
	},

	version: function() {
	    // singleton to get the platform version
	    if(platformVersion === null) this.setVersion(this.device().version);
	    return platformVersion;
	},

	setVersion: function(v) {
	    if(typeof v !== 'undefined' && v !== null) {
		v = v.split('.');
		v = parseFloat(v[0] + '.' + (v.length > 1 ? v[1] : 0));
		if(!isNaN(v)) {
		    platformVersion = v;
		    return;
		}
	    }

	    platformVersion = 0;

	    // fallback to user-agent checking
	    var pName = this.platform();
	    var versionMatch = {
		'android': /Android (\d+).(\d+)?/,
		'ios': /OS (\d+)_(\d+)?/
	    };
	    if(versionMatch[pName]) {
		v = this.ua.match( versionMatch[pName] );
		if(v.length > 2) {
		    platformVersion = parseFloat( v[1] + '.' + v[2] );
		}
	    }
	},

	exitApp: function() {
	    this.ready(function(){
		navigator.app && navigator.app.exitApp && navigator.app.exitApp();
	    });
	},

	showStatusBar: function(val) {
	    // Only useful when run within cordova
	    this._showStatusBar = val;
	    this.ready(function(){
		// run this only when or if the platform (cordova) is ready
		if(platform._showStatusBar) {
		    // they do not want it to be full screen
		    window.StatusBar && window.StatusBar.show();
		    document.body.classList.remove('status-bar-hide');
		} else {
		    // it should be full screen
		    window.StatusBar && window.StatusBar.hide();
		    document.body.classList.add('status-bar-hide');
		}
	    });
	},

	fullScreen: function(showFullScreen, showStatusBar) {
	    // showFullScreen: default is true if no param provided
	    this.isFullScreen = (showFullScreen !== false);

	    // add/remove the fullscreen classname to the body
	    if (document.readyState === 'complete') {
		// run this only when or if the DOM is ready
		if (platform.isFullScreen) {
		    document.body.classList.add('fullscreen');
		} else {
		    document.body.classList.remove('fullscreen');
		}
		// showStatusBar: default is false if no param provided
		platform.showStatusBar( (showStatusBar === true) );
	    }
	}

    };

    var onPlatformReady = function() {
	// the device is all set to go, init our own stuff then fire off our event
	platform.isReady = true;
	platform.detect();
	for(var x=0; x<readyCallbacks.length; x++) {
	    // fire off all the callbacks that were added before the platform was ready
	    readyCallbacks[x]();
	}
	readyCallbacks = [];
	//ionic.trigger('platformready', { target: document });

	document.body.classList.add('platform-ready');
    };

    // setup listeners to know when the device is ready to go
    var onDOMLoad = function() {
	if (platform.isCordova()) {
	    var mobile_script = document.createElement('script');
	    mobile_script.setAttribute('src','mobile.js');
	    document.body.appendChild(mobile_script);
	    // the window and scripts are fully loaded, and a cordova/phonegap
	    // object exists then let's listen for the deviceready
	    document.addEventListener('deviceready', onPlatformReady, false);
	} else {

	    if (platform.isNodeWebkit()) {
		var desktop_script = document.createElement('script');
		desktop_script.setAttribute('src','desktop.js');
		document.body.appendChild(desktop_script);
	    }
	    // the window and scripts are fully loaded, but the window object doesn't have the
	    // cordova/phonegap object, so its just a browser, not a webview wrapped w/ cordova
	    onPlatformReady();
	}

	document.removeEventListener('DOMContentLoaded', onDOMLoad, false);
    };

    document.addEventListener('DOMContentLoaded', onDOMLoad, false);

    return platform;
});
