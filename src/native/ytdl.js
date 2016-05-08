(function(root, factory) {

    root.YTDL = factory(root);

})(this, function() {

    'use strict';
    var SUPPORTED_TYPES = [
	'audio/mpeg',
	'audio/mp3',
	'audio/MPA',
	'audio/mpa-robust',
	'audio/mp4',
	'audio/aac',
	'audio/x-m4a',
	'audio/MP4A-LATM',
	'audio/mpeg4-generic',
	'audio/ogg',
	'audio/wav',
	'audio/wave',
	'audio/x-wav'
    ];

    // sorted from worst to best
    var YTDL_AUDIO_ENCODINGS = [
	'mp3',
	'aac',
	'vorbis',
	'wav'
    ];    

    return {
	stream: function(url, cb) {
	    var bestFormat;
	    var onInfo = function(err, info) {
		if (err) {

		    var e = err.toString();

		    if (e.indexOf('Error 100') !== -1 || e.indexOf('Code 150') !== -1) {
			cb(null);
			return;
		    }

		    cb(err);
		    return;
		}

		if (info.requires_purchase) {
		    cb(new Error('this YouTube video requires purchase'));
		    return;
		}

		var formats = info.formats.filter(function(f) {
		    var type = f.type && f.type.substr(0, f.type.indexOf(';'));
		    return f.type && SUPPORTED_TYPES.indexOf(type) > -1;
		});

		// TODO - sort formats by quality
		// for (var i = 0; i < formats.length; i += 1) {
		//     var format = formats[i];

		//     if (bestFormat == null || format.audioBitrate > bestFormat.audioBitrate || (format.audioBitrate === bestFormat.audioBitrate && YTDL_AUDIO_ENCODINGS.indexOf(format.audioEncoding) > YTDL_AUDIO_ENCODINGS.indexOf(bestFormat.audioEncoding))) {
		// 	bestFormat = format;
		//     }
		// }

		cb(null, formats);
	    };

	    if (/([0-9A-Za-z_-]{11})/ig.test(url)) url = 'https://www.youtube.com/watch?v=' + url;

	    if (Platform.isMobile()) {
		window.getInfo(url, { downloadURL: true }, onInfo);
	    } else {
		var ytdl = require('ytdl-core');
		ytdl.getInfo(url, { downloadURL: true }, onInfo);
	    }

	}
    };
});
