/* global async, LocalFileSystem, FileTransfer, cordova, window, FileError, Vitamin, Log, Platform, Network, Offline */
(function(root, factory) {

    root.Downloader = factory(root);

})(this, function() {

    'use strict';

    function onFSSuccess(fileSystem) {
        Log.debug(fileSystem.name);
    }

    function onFSFailure(err) {
	Log.error(err);
    }

    function pluck(array, property) {
	var i, rv = [];

	for (i = 0; i < array.length; ++i) {
	    rv[i] = array[i][property];
	}

	return rv;
    }

    function readSizeRecursive(entry, cb) {
	var total;

	entry.getMetadata(function(metadata) {
	    total = metadata.size;
	    if (entry.isDirectory) {
		entry.createReader().readEntries(function(entries) {
		    async.forEach(entries, function(diritem, callback) {
			readSizeRecursive(diritem, function(err, size) {
			    total += size;
			    callback(err);
			});
		    });
		}, function(err) {
		    cb(err, total);
		});
	    } else {
		cb(null, total);
	    }
	}, function(err) {
	    cb(err, total);
	});
    }

    function download(data, cb) {
	var id = data.vitamin.id;

	async.waterfall([
	    // get streams
	    function(next) {
		Vitamin.read(id, 'stream', {}, next);
	    },

	    // choose stream
	    function(hosts, next) {
		var filtered = hosts.filter(function(h) {
		    return h.stream_url && h.host !== 'vacay';
		});

		var stream_urls = pluck(filtered, 'stream_url');
		if (stream_urls.length) next(null, stream_urls[0]);
		else next('missing stream_url');
	    },

	    //save stream
	    function(url, next) {

		//TODO - validate space

		if (Network.connection.type !== 'wifi') {
		    q.pause();
		    next('network connection is not wifi');
		    return;
		}

		Log.debug('downloading: ', url);
		var fileTransfer = new FileTransfer();
		var uri = encodeURI(url);
		var store = cordova.file.dataDirectory;
		var fileURL = store + id + '.mp3';

		fileTransfer.download(uri, fileURL, function(entry) {
		    Log.debug('saved: ', entry.toURL());
		    next(null, entry.toURL());
		}, function(err) {
		    Log.error(err);
		    next(err);
		});
	    }
	], cb);
    }

    function worker(data, done) {
	if (data.vitamin.filename) {
	    Log.debug('already downloaded: ', data.vitamin.id);
	    done();
	    return;
	}

	download(data, function(err, filename) {
	    data.vitamin.filename = filename;
	    Offline.update(err, data.vitamin);
	    done(err);
	});
    }

    Platform.ready(function() {
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSSuccess, onFSFailure);
    });

    var q = async.queue(worker, 1);

    return {

	pause: function() {
	    q.pause();
	},

	resume: function() {
	    q.resume();
	},

	save: function(vitamin) {
	    q.push({ vitamin: vitamin }, function(err) {
		if (err) {
		    Log.error(err);
		    //TODO - requeue
		    return;
		}

		// TODO - broadcast completion
		Log.debug('worker completed vitamin:', vitamin.id);
	    });
	},

	remove: function(v) {

	    window.resolveLocalFileSystemURL(v.filename, function(entry) {

		entry.remove(function() {
		    delete v.filename;
		    Offline.update(null, v);
		}, function(err) {
		    Log.error(err);
		});

	    }, function(err) {

		if (err.code === FileError.NOT_FOUND_ERR) {
		    delete v.filename;
		    Offline.update(null, v);
		    return;
		}

		Log.error(err);		

	    });
	}
    };
});
