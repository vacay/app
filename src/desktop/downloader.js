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
	//TODO - check if it should be removed
	cb(err, total);
      }
    });
  }
  var download = function(vitamin, done) {
    Log.debug('started download job: ', vitamin);

    //TODO - validate if it should be downloaded still

    async.waterfall([

      function(next) {
	Vitamin.getStream(vitamin.id, {}, next);
      },

      function(url, next) {

	if (!url) {
	  next('no stream');
	  return;
	}

	Log.debug('downloading: ', url);

	var script = process.cwd() + '/worker.js';
	var child = cp.fork(script);
	
	// process.on('SIGINT',  function() { child.kill('SIGINT');  });
	// process.on('SIGTERM', function() { child.kill('SIGTERM'); });

	child.on('message', function(msg) {
	  if (msg.err) {
	    next(msg.err);
	    return;
	  }

	  if (msg.method === 'progress') {
	    Offline.updateProgress(vitamin.id, msg.progress);
	    return;
	  }

	  next();
	});

	child.on('exit', function(code, signal) {
	  Log.info('child exit', code, signal);
	  next(code);
	});

	child.send({
	  filename: offlinePath + '/' + vitamin.id + '.mp3',
	  url: url
	});		
      }
    ], done);
  };

  return {

    q: async.queue(download, 1),

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

    save: function(v) {
      this.q.push(v, function(err) {
	if (err) {
	  if (v.failure) v.failure++;
	  else v.failure = 1;
	  Offline.update(v);
	  Log.error(err);
	  return;
	}

	v.filename = v.id + '.mp3';
	Offline.update(v);
      });	
    },

    remove: function(v) {
      fs.unlink(this.offlinePath + v.filename, function(err) {
	if (err) Log.error(err);
      });
    }
  };
});
