/* global Me, window, io, App, setTimeout, Log, CONFIG */
(function(root, factory) {

  root.WS = factory(root);

})(this, function() {

  'use strict';

  return {
    events: {},
    socket: null,
    on: function(eventName, cb) {
      this.events[eventName] = cb;
      if (this.socket) this.socket.on(eventName, cb);
    },
    emit: function(eventName, data, cb) {
      if (!this.socket) return;
      this.socket.emit(eventName, data, cb);
    },
    connect: function() {
      var self = this;
      this.disconnect();

      var ioConnect = function() {
	Log.info('websocket: connecting');
	var t = window.localStorage.token || App.token;
	self.socket = io.connect(CONFIG.ws, {
	  query: 'token=' + t + (Me.ip ? '&client_ip=' + Me.ip : '')
	});

	for (var key in self.events) {
	  if (self.events.hasOwnProperty(key)) self.on(key, self.events[key]);
	}

	self.socket.on('connect', function() {
	  Log.info('websocket: connected');
	});
      };

      if (self.socket) self.socket.connect();
      else setTimeout(ioConnect);
    },
    disconnect: function() {
      if (this.socket) this.socket.close();
    }
  };
});
