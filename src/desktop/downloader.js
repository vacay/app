/* global App, require, process, async, Log, Offline, window */

(function(root, factory) {

    root.Downloader = factory(root);

})(this, function() {

    'use strict';

    var gui = require('nw.gui');
    var fs = require('fs');
    
    var path = require('path');
    var cp = require('child_process');
    var dataPath = path.join(gui.App.dataPath, 'data');
    var offlinePath = path.join(dataPath, 'offline');

    if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
    if (!fs.existsSync(offlinePath)) fs.mkdirSync(offlinePath);

    Log.info('data path: ', dataPath);
    
    var child, used;

    process.on('SIGINT',  function() { child.kill('SIGINT');  });
    process.on('SIGTERM', function() { child.kill('SIGTERM'); });    

    function spaceUsed(item, cb) {
	fs.lstat(item, function(err, stats) {

	    var total = stats.size;

	    if (!err && stats.isDirectory()) {
		fs.readdir(item, function(err, list) {
		    if (err) {
			cb(err);
			return;
		    }

		    async.forEach(list, function(diritem, callback) {
			spaceUsed(path.join(item, diritem), function(err, size) {
			    total += size;
			    callback(err);
			});
		    }, function(err) {
			cb(err, total);
		    });
		});
	    } else {
		cb(err, total);
	    }
	});
    }
    var _run = function() {
	var script = process.cwd() + '/worker.js';

	child = cp.fork(script);
	// TODO: proper logging

	child.on('message', function(msg) {
	    if (msg.err) Log.error(msg);

	    switch(msg.method) {
	    case 'progress':
		Offline.updateProgress(msg.id, msg.progress);
		break;
	    default:
		Offline.update(msg.vitamin);
		break;
	    }
	});

	child.on('exit', function(code, signal) {
	    if (code !== 0 || !signal) _run();
	});
    };

    _run();

    return {

	offlinePath: offlinePath + '/',

	clear: function(cb) {
	    var self = this;
	    try {
		var files = fs.readdirSync(self.offlinePath);
		if (files.length > 0) {
		    for (var i = 0; i < files.length; i++) {
			var filePath = self.offlinePath + files[i];
			if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
		    }
		}
		cb();
	    } catch(e) {
		cb(e);
	    }
	},

	getSpaceUsed: function(cb) {
	    spaceUsed(this.offlinePath, cb);
	},

	pause: function() {
	    child && child.send && child.send({ method: 'pause' });
	},

	resume: function() {
	    //TODO - restart worker if it does not exist
	    child && child.send && child.send({ method: 'resume' });
	},

	save: function(v) {
	    child && child.send && child.send({
		method: 'save',
		data: {
		    root: this.offlinePath,
		    env: CONFIG.env,
		    vitamin: v,
		    token: window.localStorage.token || App.token
		}
	    });
	},

	remove: function(v) {
	    child && child.send && child.send({
		method: 'remove',
		data: {
		    filename: this.offlinePath + v.filename
		}
	    });
	}
    };
});
