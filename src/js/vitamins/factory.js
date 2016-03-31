/* global Elem, Player */
(function(root, factory) {

    root.Vitamins = factory(root);

})(this, function() {

    'use strict';

    return {
	renderShuffle: function(opts) {
	    var el = Elem.create({
		tag: 'button',
		className: 'sm icon',
		childs: [{
		    tag: 'i',
		    className: 'icon-shuffle'
		}]
	    });

	    el.onclick = function() {
		Player.play(null, opts);
	    };

	    return el;
	}
    };
});
