/* global async, LocalFileSystem, FileTransfer, cordova, window, FileError, Vitamin, Log, Platform, Network, Offline */
(function(root, factory) {

    root.Downloader = factory(root);

})(this, function() {

    'use strict';

    function onFSSuccess(fileSystem) {
        Log.debug('Data Path:', fileSystem.nativeURL);
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

	// check if we should be using data
	if (Network.connection.type !== 'wifi') {
	    q.pause();
	    cb('network connection is not wifi');
	    return;
	}

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

		stream_urls.push('https://s3.amazonaws.com/vacay/' + CONFIG.env + '/vitamins/' + id + '.mp3');

		Log.debug('streams: ', stream_urls);

		if (!stream_urls.length) {
		    next('missing stream_url');
		    return;
		}

		var count = 0;
		var stream_url;
		async.whilst(function() {
		    return count < stream_urls.length && !stream_url;
		}, function(cb) {
		    var url = stream_urls[count];
		    count++;
		    Request.head(url).success(function(res) {
			stream_url = url;
			cb();
		    }).error(function(res) {
			cb();
		    });
		}, function(err, url) {
		    console.log(stream_url);
		    next(err, stream_url);
		});
	    },

	    //save stream
	    function(url, next) {

		if (!url) {
		    next('missing stream_url');
		    return;
		}

		//TODO - validate limit
		Log.debug('downloading: ', url);
		var ft = new FileTransfer();
		var uri = encodeURI(url);
		var store = cordova.file.dataDirectory;
		var fileURL = store + id + '.mp3';

		ft.download(uri, fileURL, function(entry) {
		    Log.debug('saved: ', entry.toURL());
		    next(null, entry.toURL());
		}, function(err) {
		    Log.error(err);
		    next(err);
		});

		ft.onprogress = function(e) {
		    if (e.lengthComputable) {
			Offline.updateProgress(id, (e.loaded / e.total * 100));
		    }
		};
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
	    Offline.updateUI(data.vitamin);
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
		    Offline.updateUI(v);
		}, function(err) {
		    Log.error(err);
		});

	    }, function(err) {

		if (err.code === FileError.NOT_FOUND_ERR) {
		    delete v.filename;
		    Offline.updateUI(v);
		    return;
		}

		Log.error(err);		

	    });
	}
    };
});
