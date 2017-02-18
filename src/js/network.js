/* global Request, setTimeout, Auth, page, Log, window, navigator, Platform, Downloader */
(function(root, factory) {

  root.Network = factory(root);

})(this, function() {

  'use strict';

  return {
    init: function() {
      var self = this;

      window.addEventListener('online', function() {
	setTimeout(self.test.bind(self), 100);
      }, false);

      window.addEventListener('offline', function() {
	self.test();
      }, false);

      this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      Log.info('connection type: ', this.connection ? this.connection.type : null);

      this.test();
      this.initialized = true;
    },

    test: function() {
      var self = this;
      var update = function(res) {
	var previous = self.online;
	self.online = res.status === 200;

	Log.info('health check: ', res.text);
	Log.info('online: ', self.online);

	document.body.classList.toggle('online', self.online);

	if (typeof previous !== 'undefined') {
	  if (self.online) {
	    Auth.init(function() {
	      Log.info('initialization complete');
	    });

	    if (Platform.isNative()) Downloader.q.resume();

	  } else {
	    //TODO - notify user of offline
	    Player.reset();

	    if (Platform.isNative()) {
	      page('/offline');
	      Downloader.q.pause();
	    }
	  }
	}
      };
      
      Request.get('https://api.vacay.io/health_check').success(update).error(update);
    }
  };
});
