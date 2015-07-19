/* global document, Elem, setTimeout */
(function(root, factory) {

    root.Notification = factory(root);

})(this, function() {

    'use strict';

    var p = document.getElementById('n');

    return {
	msgs: [],
	show: function(opts) {
	    var self = this;

	    if (p.firstChild) {
		self.msgs.push(opts);
		return;
	    }

	    opts = opts || {};

	    var n = Elem.create({
		className: 'n' + (opts.action ? ' action' : ''),
		text: opts.msg
	    });

	    if (opts.action) {

		var action = Elem.create({
		    tag: 'button',
		    className: 'link pull-right',
		    text: opts.action.text
		});
		action.onclick = function(e) {
		    opts.action.onclick.call(opts.action.onclick, e);
		    self.remove(n);
		};
		n.appendChild(action);

	    } else {

		setTimeout(function() {
		    self.remove(n);
		}, 4000);

	    }

	    p.appendChild(n);

	    setTimeout(function() {
		n.classList.add('enter');
		document.body.classList.add('n-visible');
	    }, 500);
	},

	remove: function(elem) {
	    p.removeChild(elem);
	    document.body.classList.remove('n-visible');

	    if (this.msgs.length) this.show(this.msgs.shift());
	}
    };
});
