/* global Request, Location, window, CONFIG */
(function(root, factory) {

    root.App = factory(root);

})(this, function() {

    'use strict';

    return {
	token: null,
	ip: null,
	api: function(path) {
	    var token = window.localStorage.token || this.token;
	    path = CONFIG.api + path;
	    return {
		get: function(params) {
		    params = params || {};
		    if (token) params.token = token;
		    return Request.get(path, params);
		},
		put: function(params) {
		    if (token) path += '?token=' + token;
		    return Request.put(path, params);
		},
		post: function(params) {
		    if (token) path += '?token=' + token;
		    return Request.post(path, params);
		},
		del: function(params) {
		    params = params || {};
		    if (token) params.token = token;
		    return Request.del(path, params);
		}
	    };
	},
	back: window.history.back.bind(window.history),
	forward: window.history.forward.bind(window.history)
    };
});
