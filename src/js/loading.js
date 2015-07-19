/* global View, Elem */
(function(root, factory) {

    root.Loading = factory(root);

})(this, function() {

    'use strict';

    var html = View.tmpl('/loading.html');

    return {
	render: function(opts) {
	    opts = opts || {};
	    var elem = Elem.create({
		className: 'md-loading' + (opts.indeterminate ? ' indeterminate' : '')
	    });
	    elem.innerHTML = html;

	    return elem;
	    
	}
    };
});
