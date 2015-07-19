/* global window, Me, App, page, WS, Log, Player, Queue */
(function (root, factory) {

    root.Auth = factory(root);

})(this, function () {

    'use strict';
    return {
	setToken: function(token) {
	    try {
		window.localStorage.token = token;
	    } catch (e) {
		Log.warn( 'Error saving token to local storage' );
	    } finally {
		App.token = token;
	    }
	},

	init: function (done) {

	    App.api('/me').get().success(function(res) {
		Me.init(res);
		done();
	    }).error(function(data, res) {
		if (res.status === 401) {
		    page('/landing');
		} else {
		    //TODO
		}
		done();
	    });
	},

	signin: function (params, cb) {
	    var self = this;
	    App.api('/auth/signin').post(params).success(function (res) {
		self.setToken(res.token);
		Me.init(res);
	    }).error(function (res) {
		cb(res);
		delete window.localStorage.token;
		delete App.token;
	    });
	},

	signout: function () {
	    //TODO: delete offline crate
	    delete window.localStorage.token;
	    delete window.localStorage.lastSync;
	    delete App.token;

	    Me.deauthenticate();
	    WS.disconnect();

	    Player.reset();
	    Queue.reset();
	},

	signup: function (params, cb) {
	    var self = this;
	    App.api('/auth/signup').post(params).success(function (res) {
		self.setToken(res.token);
		Me.init(res, true);
	    }).error(function (res) {
		cb(res);
	    });
	},

	request: function(email, cb) {
	    App.api('/auth/reset').get({ email: email }).success(function() {
		//$rootScope.$broadcast('auth:request:success');
	    }).error(function(res) {
		cb(res);
	    });
	},

	reset: function(params, cb) {
	    var self = this;
	    App.api('/auth/reset').post(params).success(function(res) {
		self.setToken(res.token);
		Me.init(res);
	    }).error(function(res) {
		cb(res);
	    });
	}    
    };    

});
