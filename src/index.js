/* global page, App, Modal, soundManager, youtubeManager, Network, Shortcuts, FastClick, window, document, Auth, Log, Platform, Player, View, Loading, Updater */
(function() {
    'use strict';
    var init = function() {
	App.initialPath = window.location.pathname + window.location.search;

	page.exit('*', function(ctx, next) {
	    View.scrollOff();
	    Modal.closeAll();
	    View.main.innerHTML = null;
	    View.main.appendChild(Loading.render({ indeterminate: true }));
	    document.body.classList.remove('menu-open');
	    if (window.innerWidth < 767) document.body.classList.remove('player-open');

	    //TODO - clear multiselect

	    next();
	});

	page('*', function(ctx, next) {
	    //TODO - check auth and redirect if necessary
	    next();
	});

	page('/', '/home');
	page('*', '/');

	Auth.init(function() {

	    page.start({ dispatch: false });
	    Log.info('initialization complete');

	});

	soundManager.setup({
	    onready: function () {
		Player.init();
	    }
	});

	youtubeManager.setup({
	    height: 200,
	    width: 200,
	    playerId: 'ym-container'
	});

	Network.init();

	Shortcuts.init();

	FastClick.attach(document.body);
    };

    Platform.ready(function() {
	if (Platform.isNodeWebkit()) {
	    Updater.init(function() {
		init();
	    });
	} else {
	    init();
	}
    });
})();
