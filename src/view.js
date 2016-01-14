/* global document, Loading, Elem, doT, Request, window */
(function(root, factory) {

    root.View = factory(root);

})(this, function() {

    'use strict';

    var m = document.getElementById('main');

    return {
	main: m,
	_onScroll: function() {
	    var r = document.getElementById('river');
	    if (r.dataset.loading) return;

	    var scrollDistance = 2;
	    var remaining = m.scrollHeight - m.scrollTop - m.offsetHeight;
	    var shouldScroll = remaining <= (m.offsetHeight * scrollDistance);
	    if (shouldScroll) {
		r.dataset.loading = true;
		this.load();
	    }
	},
	tmpl: function(id) {
	    return document.getElementById(id).innerHTML;
	},
	scrollOff: function() {
	    m.removeEventListener('scroll', this._listener);
	},
	render: function(opts) {
	    opts = opts || {};
	    var html = '';
	    if (opts.id) html = this.tmpl(opts.id);
	    if (opts.data) html = doT.template(html)(opts.data);
	    if (opts.filter) html += this.tmpl('/filter/container.html');
	    m.innerHTML = html;

	    var river = Elem.create({
		className: opts.className || 'u u720',
		attributes: {
		    id: 'river'
		}
	    });
	    river.dataset.loading = true;
	    var list = Elem.create({ className: 'list cf' });
	    river.appendChild(list);
	    river.appendChild(Loading.render({ indeterminate: true }));

	    m.appendChild(river);

	    if (opts.load) {
		opts.load();
		this.load = opts.load;
		this._listener = window.Throttle(this._onScroll.bind(this));
		m.addEventListener('scroll', this._listener);
	    }
	},
	github: function(file, cb) {
	    var url = 'https://api.github.com/repos/vacay/docs/contents/';
	    var req = Request.get(url + file + '.md');
	    req.success(function(res) {
		var content = window.atob(res.content);
		cb(null, content);
	    }).error(function(res) {
		cb(res, null);
	    });
	},
	trigger: function(elem, type) {
	    elem.classList.toggle('active');
	    document.body.classList.toggle(type + '-open');
	},
	active: function(s) {
	    document.querySelector(s).classList.add('active');
	}
    };

});
