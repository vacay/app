/* global require, process, console, __dirname */

var request = require('request');
var progress = require('request-progress');
var fs = require('fs');

var done = function(err) {
    process.send({ err: err });
};

process.on('message', function(data) {

    var writeStream = fs.createWriteStream(data.filename);
    writeStream.on('finish', done);
    writeStream.on('error', done);

    progress(request(data.url), { throttle: 500 }).on('progress', function(state) {
	process.send({
	    method: 'progress',
	    progress: state.size.transferred / state.size.total * 100
	});
    }).on('error', function(err) {
	done(err);
    }).pipe(writeStream);    

});

process.on('uncaughtException', function(err) {
    done(err);
});
