/* global page, App, Modal, soundManager, youtubeManager, Network, Shortcuts, FastClick, window, document, Auth, Log, Platform, Player, View, Loading, Updater, Elem */
(function() {
    'use strict';
    var init = function() {
	page.exit('*', function(ctx, next) {
	    View.scrollOff();
	    Modal.closeAll();
	    View.title('');
	    View.main.innerHTML = null;
	    View.main.appendChild(Loading.render({ indeterminate: true }));
	    document.body.classList.remove('menu-open');
	    document.body.classList.remove('help-open');
	    if (window.innerWidth < 900) document.body.classList.remove('player-open');
	    Elem.each(document.querySelectorAll('#toolbar a'), function(e) {
		e.classList.remove('active');
	    });

	    //TODO - clear multiselect

	    next();
	});

	page('*', function(ctx, next) {
	    next();
	});

	page('*', '/');

	Auth.init(function() {

	    page.start({ dispatch: false });
	    Log.info('initialization complete');

	    if (Utils.isUrl(window.location.pathname.substring(1))) {
		page('/search?q=' + window.location.pathname.substring(1));
	    } else {
		page(window.location.pathname + window.location.search);
		var search = Location.search();
		if (search.invite || search.reset) Landing.show(search);
	    }

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
	    //console.log(Updater);
	    //Updater.init(function() {
		init();
	//});
	} else {
	    init();
	}
    });
})();
