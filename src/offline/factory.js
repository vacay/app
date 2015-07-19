/* global Utils, localforage, User, Me, window, Log, Downloader, document, Elem */
(function(root, factory) {

    root.Offline = factory(root);

})(this, function() {

    'use strict';

    return {
	limit: window.localStorage.limit || 1000000000, // 1 gb
	check: function() {
	    var jobs = 0;
	    var available = 0;
	    var unavailable = 0;

	    localforage.iterate(function(v) {

		if (v.filename) {
		    available ++;

		    if (!v.offline) Downloader.remove(v);
		    else {
			//TODO - make sure file is there
		    }

		} else {

		    unavailable++;

		    if (v.offline && jobs < 50) {
			jobs++;
			Downloader.save(v);
		    } else {
			//TODO - make sure file does not exist
		    }
		}

	    }, function() {
		Log.debug('download jobs queued: ', jobs);
		Log.debug('available offline: ', available);
		Log.debug('unavailable offline: ', unavailable);
		Log.debug('total: ', available + unavailable);
	    });	    
	},
	init: function() {
	    var offset = 0;
	    var lastSync = new Date(window.localStorage.lastSync || 1);

	    Log.info('last sync:', Utils.fromNow(lastSync));

	    var sync = function() {
		localforage.keys(function(err, ids) {
		    if (err) Log.error(err);

		    if (ids.length) {
			Me.sync({
			    ids: ids
			}, function(err, vitamins) {
			    if (err) Log.error(err);
			    else {
				for (var i=0; i<vitamins.length; i++) {
				    localforage.removeItem(vitamins[i].id.toString(), Log.error);
				}
			    }
			});
		    }
		});
	    };

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

	    //TODO - check crate count

	    sync();
	    load(response);

	    this.check();
	},

	toggle: function(data) {
	    var self = this;
	    localforage.getItem(data.id.toString()).then(function(v) {
		v.offline = !v.offline;
		self.update(null, v);
		localforage.setItem(data.id.toString(), v, function(err, o) {
		    if (err) Log.error(err);
		    v.offline ? Downloader.save(o) : Downloader.remove(o);
		});
	    });

	},

	update: function(err, data) {
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
