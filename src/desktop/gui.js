/* global Mousetrap, App, require, process, window, Log */
(function() {

    'use strict';

    var gui = require('nw.gui');
    var win = gui.Window.get();
    var mb = new gui.Menu({ type:'menubar' });
    mb.createMacBuiltin('vacay');
    gui.Window.get().menu = mb;

    win.focus();

    Mousetrap.bind([ 'ctrl+d' ], function () {
	win.showDevTools();
    });

    App.back = function() {
	window.history.back();
    };

    App.forward = function() {
	window.history.forward();
    };

    App.minimize = function() {
	win.minimize();
    };

    App.exit = function() {
	gui.App.closeAllWindows();
    };

    App.maximize = function() {
	win.toggleFullscreen();
    };

    process.on('uncaughtException', function (err) {
	Log.error(err);
    });
    
})();
