/* global App */
(function(root, factory) {

    root.Search = factory(root);

})(this, function() {

    'use strict';

    return {
	query: function(type, params, cb) {
	    App.api('/search/' + type).get(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	}
    };
});
