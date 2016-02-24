/* global require, process, console, __dirname */

var async = require('async');
var mkdirp = require('mkdirp');
var request = require('request');
var progress = require('request-progress');
var fs = require('fs');

function pluck(array, property) {
    var i, rv = [];

    for (i = 0; i < array.length; ++i) {
	rv[i] = array[i][property];
    }

    return rv;
}

var download = function(data, done) {
    var id = data.vitamin.id;
    var token = data.token;

    var filename = id + '.mp3';

    async.waterfall([
	// get hosts
	function(next) {
	    var url = 'https://api.vacay.io/v1/vitamin/' + id + '/stream?token=' + token;
	    request.get(url, { json: true }, next);
	},

	// find a healthy stream_url
	function(res, body, next) {
	    var hosts = body.data;
	    var ext_hosts = hosts.filter(function(h) {
		return h.title !== 'vacay' && h.stream_url;
	    });

	    var stream_urls = pluck(ext_hosts, 'stream_url');
	    stream_urls.push('https://s3.amazonaws.com/vacay/' + data.env + '/vitamins/' + id + '.mp3');

	    if (!stream_urls.length) {
		next('missing stream_url');
		return;
	    }

	    // go through stream_urls until healthy stream_url
	    var check_health = function(url, check) {
		request({
		    method: 'HEAD',
		    url: url
		}, function(e, res) {
		    if (!e && res.statusCode === 200) check(true);
		    else check(false);
		});
	    };

	    async.detect(stream_urls, check_health, function(result) {
		if (result) next(null, result);
		else next('missing stream_url');
	    });
	},

	function(stream_url, next) {

	    var writeStream = fs.createWriteStream(data.root + '/' + filename);
	    writeStream.on('finish', next);
	    writeStream.on('error', next);

	    progress(request(stream_url), { throttle: 500 }).on('progress', function(state) {
		process.send({
		    method: 'progress',
		    id: id,
		    progress: state.size.transferred / state.size.total * 100
		});
	    }).on('error', function(err) {
		next(err);
	    }).pipe(writeStream);
	}

    ], done);

};

var q = async.queue(download, 1);

var save = function(message) {
    q.push(message.data, function(err) {

	message.data.vitamin.filename = message.data.root + '/' + message.data.vitamin.id + '.mp3';

	process.send({
	    err: err,
	    method: message.method,
	    vitamin: message.data.vitamin
	});
    });
};

var remove = function(message) {
    fs.unlink(message.data.vitamin.filename, function(err) {

	delete message.data.vitamin.filename;

	process.send({
	    err: err,
	    method: message.method,
	    vitamin: message.data.vitamin
	});
    });
};

process.on('message', function(message) {

    switch(message.method) {
    case 'save':
	save(message);
	break;

    case 'remove':
	remove(message);
	break;

    case 'pause':
	q.pause();
	break;

    case 'resume':
	q.resume();
	break;

    default:
	//TODO - log properly
	process.send({ err: 'message method not handled', data: message });
	break;
    }
});

process.on('uncaughtException', function(err) {
    process.send({ err: err });
});
