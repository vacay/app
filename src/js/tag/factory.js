/* global Elem, Utils, Me, App, Log, document */
(function(root, factory) {

    root.Tag = factory(root);

})(this, function() {

    'use strict';

    return {
	render: function(value, opts) {
	    opts = opts || {};

	    var elem = Elem.create({
		tag: 'span',
		className: 'tag'
	    });

	    var link = Elem.create({
		tag: 'a',
		text: value
	    });

	    elem.appendChild(link);

	    if (opts.link)
		link.href = '/@' + Me.username + '/tag/' + encodeURIComponent(value);

	    if (opts.remove) {

		var remove = Elem.create({
		    tag: 'a',
		    className: 'remove',
		    text: 'x'
		});

		elem.appendChild(remove);
	    }

	    elem.dataset.value = value;

	    return elem;
	},

	create: function(id, params, cb) {
	    //TODO - if native - update localforage
	    var self = this;
	    var divs = document.querySelectorAll('.vitamin[data-id="' + id + '"] .current');

	    Elem.each(divs, function(div) {
		div.appendChild(self.render(params.value, { link: true, remove: true }));
	    });

	    App.api('/vitamin/' + id + '/tag').post(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		var divs = document.querySelectorAll('.vitamin[data-id="' + id + '"] .tag[data-value="' + params.value + '"]');

		Elem.each(divs, function(div) {
		    div.parentNode.removeChild(div);
		});

		cb(res.data, null);
	    });
	},

	destroy: function(id, params, cb) {
	    //TODO - if native - update localforage
	    var self = this;
	    var divs = document.querySelectorAll('.vitamin[data-id="' + id + '"] .tag[data-value="' + params.value + '"]');

	    Elem.each(divs, function(div) {
		div.parentNode.removeChild(div);
	    });

	    App.api('/vitamin/' + id + '/tag').del(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		var divs = document.querySelectorAll('.vitamin[data-id="' + id + '"] .current');

		Elem.each(divs, function(div) {
		    div.appendChild(self.render(params.value, { link: true, remove: true }));
		});

		cb(res, null);
	    });
	}
    };
});
