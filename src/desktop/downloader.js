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

    if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);

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
		//TODO - make sure file exists in localforage
		//console.log(item);
		
		cb(err, total);
	    }
	});
    }
    var _run = function() {
	var script = process.cwd() + '/webtorrent.js';

	spaceUsed(dataPath, function(err, total) {
	    if (err) {
		Log.error(err);
		return;
	    }

	    used = total;
	    Log.debug('space used: ', used);

	    child = cp.fork(script);
	    // TODO: proper logging

	    child.on('message', function(data) {
		Offline.update(data.err, data.vitamin);
	    });

	    child.on('exit', function(code, signal) {
		if (code !== 0 || !signal) _run();
	    });

	});
    };

    _run();

    return {

	pause: function() {
	    child && child.send && child.send({ method: 'pause' });
	},

	resume: function() {
	    //TODO - restart worker if it does not exist
	    child && child.send && child.send({ method: 'resume' });
	},

	save: function(v) {
	    var torrent_file = 'https://s3.amazonaws.com/vacay/production/vitamins/' + v.id + '.mp3?torrent';

	    child && child.send && child.send({
		method: 'save',
		data: {
		    torrent_file: torrent_file,
		    root: dataPath,
		    vitamin: v,
		    token: window.localStorage.token || App.token,
		    available: Offline.limit - used
		}
	    });
	},

	remove: function(v) {
	    child && child.send && child.send({
		method: 'remove',
		data: {
		    vitamin: v
		}
	    });
	}
    };
});
