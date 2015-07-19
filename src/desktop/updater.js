/* global require, setTimeout, Log, document */
(function(root, factory) {

    root.Updater = factory(root);
    
})(this, function() {

    'use strict';
    
    var gui = require('nw.gui');    
    var copyPath, execPath;
    if (gui.App.argv.length) {
	copyPath = gui.App.argv[0];
	execPath = gui.App.argv[1];
    }

    var pkg = require('./package.json');
    var request = require('request');
    var url = require('url');
    var Updater = require('node-webkit-updater');
    var upd = new Updater(pkg);

    function newVersionDownloaded(err, filename, manifest) {
	if (err) {
	    Log.error(err);
	    return;
	}
	upd.unpack(filename, newVersionUnpacked, manifest);
    }

    function newVersionUnpacked(err, newAppPath) {
	if (err) {
	    Log.error(err);
	    return;
	}
	upd.runInstaller(newAppPath, [upd.getAppPath(), upd.getAppExec()]);
	gui.App.quit();
    }

    function setVersion(v) {
	document.getElementById('version').innerHTML = v;
    }

    return {
	init: function(done) {
	    if (!copyPath) {
		request.get(url.resolve(pkg.manifestUrl, '/version/' + pkg.version));
		setVersion('v' + pkg.version);
		upd.checkNewVersion(function(err, newVersionExists, manifest) {
		    if (err) {
			Log.error(err);
			done();
			return;
		    } else if (!newVersionExists) {
			Log.debug('No new version exists');
			done();
			return;
		    }

		    var loaded = 0;
		    var newVersion = upd.download(function(error, filename) {
			setTimeout(function(){
			    newVersionDownloaded(error, filename, manifest);
			}, 5000);
		    }, manifest);

		    newVersion.on('data', function(chunk) {
			loaded+=chunk.length;
			setVersion(Math.floor(loaded / newVersion['content-length'] * 100) + '%');
		    });
		});
	    } else {
		upd.install(copyPath, function(err) {
		    if (err) {
			Log.error(err);
			return;
		    }
		    upd.run(execPath, null);
		    gui.App.quit();
		});
	    }
	}
    };
});
