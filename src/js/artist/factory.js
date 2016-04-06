/* global Elem, App */
(function(root, factory) {

    root.Artist = factory(root);

})(this, function() {

    'use strict';

    return {
	render: function(data, opts) {
	    opts = opts || {};

	    var elem = Elem.create({
		className: 'artist i'
	    });

	    var avatar = Elem.create({
		className: 'avatar'
	    });

	    var img = Elem.create({
		tag: 'img',
		attributes: {
		    src: data.avatar
		}
	    });

	    if (!opts.single) {
		elem.classList.add('i-left');
		avatar.classList.add('left');
	    }

	    avatar.appendChild(img);
	    elem.appendChild(avatar);

	    var body = Elem.create({ className: 'i-body' });
	    var o = {

		tag: opts.single ? 'h1' : 'a',
		className: 'i-title',
		attributes: {},
		text: data.name
	    };

	    if (!opts.single) o.attributes.href = '/artist/' + data.id;

	    var name = Elem.create(o);
	    body.appendChild(name);

	    var meta = Elem.create({
		tag: 'small',
		text: data.artist_location || ''
	    });
	    body.appendChild(meta);

	    elem.appendChild(body);

	    if (opts.shuffle) {
		var shuffle = Vitamins.renderShuffle({
		    title: data.name + '\'s (artist) vitamins',
		    path: '/artist/' + data.id + '/vitamins',
		    params: {
			limit: 1,
			order_by: 'rand'
		    }
		});
		elem.appendChild(shuffle);
	    }

	    return elem;
	},

	read: function(id, subpath, params, cb) {
	    var url = '/artist/' + id;
	    if (subpath) url += '/' + subpath;
	    App.api(url).get(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	}
    };
});
