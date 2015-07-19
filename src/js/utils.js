/* global atob, Blob, ArrayBuffer, Uint8Array */
(function(root, factory) {

    root.Utils = factory(root);

})(this, function() {

    'use strict';

    var o = {
	sec: 1000,
	min: 60 * 1000,
	hr: 60 * 1000 * 60,
	day: 24 * 60 * 1000 * 60,
	wk: 7 * 24 * 60 * 1000 * 60,
	mo: 30 * 24 * 60 * 1000 * 60,
	yr: 365 * 24 * 60 * 1000 * 60
    };

    var mimesToExt = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/gif': 'gif',
	'image/tiff': 'tif'
    };    

    return {

	dataURItoBlob: function(dataURI) {

	    var byteString = atob(dataURI.split(',')[1]);

	    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

	    var ab = new ArrayBuffer(byteString.length);
	    var ia = new Uint8Array(ab);
	    for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	    }

	    var bb = new Blob([ab], { type: mimeString });
	    return bb;
	},

	duration: function(v) {
	    if (!v) return '';
	    var sec_num = parseInt(v, 10);
	    var hours = Math.floor(sec_num / 3600);
	    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	    var seconds = sec_num - (hours * 3600) - (minutes * 60);

	    if (hours < 10) {hours = hours ? '0'+hours+':' : '';}
	    else hours = hours + ':';

	    if (minutes < 10) {minutes = '0'+minutes+':';}
	    else minutes = minutes + ':';

	    if (seconds < 10) {seconds = '0'+seconds;}

	    return hours+minutes+seconds;
	},

	fromNow: function(nd) {
	    if (!nd) return 'now';
	    var r = Math.round, pl = function(v, n) {
		return n + ' ' + v + (n > 1 ? 's' : '') + ' ago';
	    }, ts = new Date().getTime() - new Date(nd).getTime(), ii;
	    if (ts < 0) return 'now';
	    for (var i in o) {
		if (o.hasOwnProperty(i)) {
		    if (r(ts) < o[i]) return pl(ii || 'm', r(ts / (o[ii] || 1)));
		    ii = i;
		}
	    }
	    return pl(i, r(ts / o[i]));
	},

	exists: function(array, value, attr) {
	    return !!array[this.find(array, value, attr)];
	},

	find: function(array, value, attr) {
	    attr = attr || 'id';
	    for(var i = 0; i < array.length; i += 1) {
		if (array[i][attr] === value) return i;
	    }

	    return -1;
	},

	// https://github.com/bevacqua/fuzzysearch
	fuzzysearch: function(needle, haystack) {
	    var hlen = haystack.length;
	    var nlen = needle.length;
	    if (nlen > hlen) {
		return false;
	    }
	    if (nlen === hlen) {
		return needle === haystack;
	    }
	    outer: for (var i = 0, j = 0; i < nlen; i++) {
		var nch = needle.charCodeAt(i);
		while (j < hlen) {
		    if (haystack.charCodeAt(j++) === nch) {
			continue outer;
		    }
		}
		return false;
	    }
	    return true;
	},

	getExtByMime: function(mime) {
	    if (mimesToExt.hasOwnProperty(mime)) {
		return mimesToExt[mime];
	    }
	    return false;
	},
	isUrl: function (text) {
	    var pattern = '^(https?:\\/\\/)?' + // protocol
		    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
		    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
		    '(?::\\d{2,5})?' + // port
		    '(?:/[^\\s]*)?$'; // path

            var re = new RegExp(pattern, 'i');
            return re.test(text);
        },

	clone: function(obj) {
	    var target = {};
	    for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
		    target[i] = obj[i];
		}
	    }
	    return target;
	}
    };

});
