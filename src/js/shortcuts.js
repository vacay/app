/* global Mousetrap, Player, page, document, window */
(function(root, factory) {

    root.Shortcuts = factory(root);
    
})(this, function() {

    'use strict';

    return {
	init: function() {
	    Mousetrap.bind('space', function () {
		Player.play();
		return false;
	    });

	    Mousetrap.bind('left', function () {
		Player.previous();
	    });

	    Mousetrap.bind('right', function () {
		Player.next();
	    });

	    Mousetrap.bind('s', function() {
		if (window.location.pathname !== '/search')
		    page('/search');
		else
		    document.querySelector('#search input').focus();

		return false;
	    });

	    Mousetrap.bind('i', function() {
		page('/inbox');
		return false;
	    });

	    Mousetrap.bind('c', function() {
		if (Me.id) page('/@' + Me.username + '/crate');
		return false;
	    });

	    Mousetrap.bind('d', function() {
		if (Me.id) page('/@' + Me.username + '/drafts');
		return false;
	    });

	    Mousetrap.bind('h', function() {
		page('/');
		return false;
	    });

	}
    };
});
