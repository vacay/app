/* global async, LocalFileSystem, FileTransfer, cordova, window, FileError, Vitamin, Log, Platform, Network, Offline */
(function(root, factory) {

    root.Downloader = factory(root);

})(this, function() {

    'use strict';

    function onFSSuccess(fileSystem) {
        Log.debug('Data Path:', cordova.file.dataDirectory);
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
		    }, function(err) {
			cb(err, total);
		    });
		}, function(err) {
		    cb(err, total);
		});
	    } else {
		//TODO - check if it should be removed
		cb(null, total);
	    }
	}, function(err) {
	    cb(err, total);
	});
    }

    function download(data, done) {
	Log.debug('started download job: ', data);
	var id = data.vitamin.id;

	//TODO - check if we should be using data
	// if (Network.connection.type !== 'wifi') {
	//     q.pause();
	//     cb('network connection is not wifi');
	//     return;
	// }

	//TODO - validate if it should be downloaded still

	async.waterfall([

	    function(next) {
		Vitamin.getStream(id, {}, next);
	    },

	    function(url, next) {

		if (!url) {
		    next('no stream');
		    return;
		}

		Log.debug('downloading: ', url);
		var ft = new FileTransfer();
		var uri = encodeURI(url);
		var fileURL = cordova.file.dataDirectory + 'offline/' + id + '.mp3';

		ft.download(url, fileURL, function(entry) {
		    Log.debug('saved: ', entry.toURL());
		    next();
		}, function(err) {
		    next(err);
		}, true, {
		    headers: {
			'User-Agent': window.navigator.userAgent
		    }
		});

		ft.onprogress = function(e) {
		    if (e.lengthComputable) {
			Offline.updateProgress(id, (e.loaded / e.total * 100));
		    }
		};
	    }
	], done);
    }

    var downloader = {
	q: async.queue(download, 1),

	clear: function(cb) {
	    window.resolveLocalFileSystemURL(this.offlinePath, function(entry) {
		entry.createReader().readEntries(function(entries) {
		    async.forEach(entries, function(diritem, callback) {
			entry.remove(function() {
			    Log.debug('File removed: ', diritem);
			}, callback);
		    }, cb);
		}, cb);
	    }, function(err) {
		if (err.code === FileError.NOT_FOUND_ERR) {
		    cb();
		    return;
		}
		cb(err);
	    });
	},

	getSpaceUsed: function(cb) {
	    window.resolveLocalFileSystemURL(this.offlinePath, function(entry) {
		readSizeRecursive(entry, cb);
	    }, function(err) {
		if (err.code === FileError.NOT_FOUND_ERR) {
		    cb(null, 0);
		    return;
		}
		cb(err);
	    });
	},

	save: function(vitamin) {
	    this.q.push({ vitamin: vitamin }, function(err) {
		if (err) {
		    if (vitamin.failure) vitamin.failure++;
		    else vitamin.failure = 1;
		    Offline.update(vitamin);
		    Log.error(err);
		    return;
		}

		vitamin.filename = vitamin.id + '.mp3';
		Offline.update(vitamin);
	    });
	},

	remove: function(v) {

	    var path = this.offlinePath + v.filename;

	    window.resolveLocalFileSystemURL(path, function(entry) {

		entry.remove(function() {
		    Log.debug('File removed: ', path);
		}, function(err) {
		    Log.error(err);
		});

	    }, function(err) {

		if (err.code === FileError.NOT_FOUND_ERR) {
		    Log.debug('File not found: ', path);
		    return;
		}

		Log.error(err);		

	    });
	}
    };

    Platform.ready(function() {
	downloader.offlinePath = cordova.file.dataDirectory + 'offline/';
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFSSuccess, onFSFailure);
    });

    return downloader;
});
