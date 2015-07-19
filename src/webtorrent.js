/* global require, process, console, __dirname */

var async = require('async');
var WebTorrent = require('webtorrent');
var client = new WebTorrent({
    dht: false,
    maxPeers: 50
});

var mkdirp = require('mkdirp');
var request = require('request');
var nt = require('nt');
var fs = require('fs');

function pluck(array, property) {
    var i, rv = [];

    for (i = 0; i < array.length; ++i) {
	rv[i] = array[i][property];
    }

    return rv;
}

var download = function(data, done) {
    var tmp = data.root || __dirname;

    var torrent_url = data.torrent_file;
    var id = data.vitamin.id;
    var token = data.token;

    var filename, folder, metadata;

    async.waterfall([
	// TODO - save torrent file/metadata locally
	// get torrent metadata
	function(next) {
	    console.log('getting torrent: ', torrent_url);
	    nt.read(torrent_url, next);
	},

	// check if full file already exists
	function(torrent, next) {
	    metadata = torrent.metadata;
	    var hash = torrent.infoHash();
	    filename = torrent.metadata.info.name;
	    folder = tmp + '/webtorrent/' + hash;

	    console.log('checking for file: ', folder + '/' + filename);
	    fs.stat(folder + '/' + filename, function(err, stats) {
		next(null, stats);
	    });
	},

	// mkdir using infoHash
	function(stats, next) {
	    console.log(stats);
	    console.log(metadata.info);

	    if (metadata.info.length > data.available) {
		next('Exceeded limit');
	    }

	    if (stats && stats.size === metadata.info.length) {
		next('Already exists');
	    } else {
		mkdirp(folder, next);
	    }
	},

	// get hosts
	function(made, next) {
	    var url = 'https://api.vacay.io/v1/vitamin/' + id + '/stream?token=' + token;
	    console.log(url);
	    request.get(url, { json: true }, next);
	},

	// find a healthy stream_url
	function(res, body, next) {
	    var hosts = body.data;
	    var ext_hosts = hosts.filter(function(h) {
		return h.title !== 'vacay' && h.stream_url;
	    });

	    var stream_urls = pluck(ext_hosts, 'stream_url');

	    console.log(stream_urls);

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

	    console.log(stream_url);

	    var writeStream = fs.createWriteStream(folder + '/' + filename);
	    writeStream.on('finish', next);
	    writeStream.on('error', next);

	    request.get(stream_url).on('error', function(err) {
		console.log(err);
		next(err);
	    }).pipe(writeStream);
	}

    ], done);

};

var q = async.queue(download, 2);

var save = function(message) {
    q.push(message.data, function(err) {

	//TODO - handle error

	//TODO - dont redownload torrent_file
	client.add(message.data.torrent_file, {
	    tmp: message.data.root,
	    verify: true
	}, function(torrent) {

	    var file = torrent.files[0].fd;
	    if (file && !message.data.vitamin.filename) {
		message.data.vitamin.filename = file.filename;
		console.log('filename:', message.data.vitamin.filename);
	    }

	    process.send({
		err: err,
		method: message.method,
		vitamin: message.data.vitamin
	    });
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
	console.error('message method not handled', message);
	break;
    }
});
