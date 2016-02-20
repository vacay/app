/* global Network, page, document, View, Log, async, localforage, Vitamin */
(function() {

    page('/offline', function() {

	var offset = 0;
	var load = function(options) {

	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');
	    var f = document.createDocumentFragment();

	    async.waterfall([
		function(next) {
		    localforage.keys(next);
		},
		function(keys, next) {
		    keys = keys.splice(offset, 50);
		    offset += 50;
		    var append = function(key, done) {
			localforage.getItem(key, function(err, value) {
			    if (err) {
				done(err);
				return;
			    }

			    f.appendChild(Vitamin.render(value));
			    done();
			});
		    };

		    async.each(keys, append, next);
		}
	    ], function(err) {
		if (err) {
		    Log.error(err);
		    return;
		}

		l.appendChild(f);
		delete r.dataset.loading;
	    });
	};
	
	View.render({
	    load: load
	});
    });

})();
