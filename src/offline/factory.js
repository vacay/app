/* global Utils, localforage, User, Me, window, Log, Downloader, document, Elem */
(function(root, factory) {

    root.Offline = factory(root);

})(this, function() {

    'use strict';

    return {
	used: null,
	limit: window.localStorage.limit || 1000000000, // 1 gb
	setLimit: function(limit) {
	    this.limit = window.localStorage.limit = limit;
	},
	init: function() {
	    var offset = 0;
	    var lastSync = new Date(window.localStorage.lastSync || 1);

	    Log.info('last sync:', Utils.fromNow(lastSync));

	    // Remove any stale crates
	    var sync = function() {
		localforage.keys(function(err, ids) {
		    if (err) {
			Log.error(err);
			return;
		    }

		    if (!ids.length) return;

		    Me.sync({
			ids: ids
		    }, function(err, vitamins) {
			if (err) {
			    Log.error(err);
			    return;
			}

			for (var i=0; i<vitamins.length; i++) {
			    //TODO - remove file
			    localforage.removeItem(vitamins[i].id.toString(), Log.error);
			}
		    });
		});
	    };

	    // get any new crates
	    var load = function(cb) {
		User.read(Me.username, 'crate', {
		    order_by: 'asc',
		    created_at: lastSync,
		    limit: 50,
		    offset: offset
		}, cb);
	    };
	    var response = function(err, results) {
		if (err) {
		    Log.error(err);
		    return;
		}

		results.forEach(function(v) {
		    localforage.setItem(v.id.toString(), v, function(err) {
			if (err) Log.error(err, v);
		    });
		});

		if (results.length === 50) {
		    offset += 50;
		    load(response);
		} else {
		    window.localStorage.lastSync = new Date();
		}
	    };

	    sync();
	    load(response);

	    //this.check();
	},

	toggle: function(data) {
	    var self = this;
	    localforage.getItem(data.id.toString()).then(function(v) {
		v.offline = !v.offline;
		self.updateUI(null, v);
		localforage.setItem(data.id.toString(), v, function(err, o) {
		    if (err) Log.error(err);
		    v.offline ? Downloader.save(o) : Downloader.remove(o);
		});
	    });

	},

	updateUI: function(err, data) {
	    if (err) {
		if (err === 'Exceeded limit') {
		    // TODO
		    return;
		}

		Log.error(err);
		return;
	    }

	    localforage.setItem(data.id.toString(), data, function(err) {
		if (err) Log.error(err);

		var divs = document.querySelectorAll('.vitamin[data-id="' + data.id + '"] .i-description');

		// update UI
		Elem.each(divs, function(div) {

		    var icon = div.querySelector('i');

		    if (data.offline) {
			if (!icon)
			    div.appendChild(Elem.create({tag: 'i', className: 'icon-download'}));
			else if (data.filename)
			    icon.classList.add('success');
		    } else {
			div.removeChild(icon);
		    }
		});
		
	    });

	}
    };
});
