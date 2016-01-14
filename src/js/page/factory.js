/* global doT, App, Me, Utils, document, Elem, Log, View */
(function(root, factory) {

    root.Page = factory(root);

})(this, function() {

    'use strict';

    var tmpl = doT.template(View.tmpl('/page/item.html'));

    return {
	render: function(data, opts) {
	    opts = opts || {};

	    var elem = Elem.create({
		className: 'page i'
	    });

	    data.time = data._pivot_created_at ? Utils.fromNow(data._pivot_created_at) : '';
	    data.displayURL = this.displayURL(data.url);
	    elem.innerHTML = tmpl(data);

	    if (opts.subscribe && Me.id) {
		var isSubscribed = Me.isSubscribed('pages', data.id);
		var btn = Elem.create({
		    tag: 'button',
		    className: 'rnd sm success',
		    text: isSubscribed ? 'subscribed' : 'subscribe'
		});
		btn.onclick = function() {
		    var cb = function(err) {
			if (err) Log.error(err);
		    };

		    if (btn.classList.contains('active')) {
			Me.unsubscribe('pages', data, cb);
		    } else {
			Me.subscribe('pages', data, cb);
		    }
		    btn.classList.toggle('active');
		};
		btn.classList.toggle('active', isSubscribed);

		if (!opts.single) {
		    elem.classList.add('i-right');
		    btn.classList.add('right');
		}

		elem.appendChild(btn);
	    }

	    if (data.title) {
		var title = Elem.create({
		    tag: 'p',
		    className: 'meta'
		});
		title.innerHTML = data.title;
		elem.querySelector('.i-body').appendChild(title);
	    }
	    
	    return elem;
	},
	displayURL: function(url) {
	    var parser = document.createElement('a');
	    parser.href = url;
	    var base = parser.hostname.substring(0,3) === 'www' ?
		    parser.hostname.slice(4):
		    parser.hostname;
	    return base + parser.pathname;
	},
	read: function(id, subpath, params, cb) {
	    var url = '/page/' + id;
	    if (subpath) url+= '/' + subpath;
	    App.api(url).get(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},
	create: function(url, cb) {
	    App.api('/page').post({url: url}).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	}
    };

});
