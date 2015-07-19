/* global Elem, Player */
(function(root, factory) {

    root.Vitamins = factory(root);

})(this, function() {

    'use strict';

    return {
	renderHeading: function(opts) {
	    opts = opts || {};

	    var elem = Elem.create({ className: 'i' });

	    if (opts.shuffle) {
		var shufflePlay = Elem.create({
		    tag: 'button',
		    className: 'sm icon',
		    childs: [{
			tag: 'i',
			className: 'icon-shuffle'
		    }]
		});

		shufflePlay.onclick = function() {
		    Player.play(null, opts.shuffle);
		};
		elem.appendChild(shufflePlay);
	    }

	    return elem;
	}
    };
});
