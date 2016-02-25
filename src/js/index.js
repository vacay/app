/* global page, Prescription, document, Log, View */
(function() {

    page('/', function() {

	var t = Me.id ? 'subscriptions' : 'featured';
	var offset = 0;

	var load = function(opts) {
	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');

	    if (opts) {
		document.querySelector('.filter-container .' + t).classList.remove('active');
		r.dataset.loading = true;
		l.innerHTML = null;
		offset = 0;
		if (opts.t) t = opts.t;
		View.active('.filter-container .' + t);
		View.scrollOn();
	    }

	    Prescription.browse({
		featured: t === 'featured',
		subscriptions: t === 'subscriptions',
		offset: offset
	    }, function(err, prescriptions) {
		if (err) {
		    Log.error(err);
		    r.dataset.loadingError = true;
		    return;
		}

		if (prescriptions.length < 10) View.scrollOff();
		offset += prescriptions.length;

		var frag = document.createDocumentFragment();
		prescriptions.forEach(function(p) {
		    frag.appendChild(Prescription.render(p));
		});
		l.appendChild(frag);

		delete r.dataset.loading;
	    });
	};

	View.render({ load: load, filter: true, title: 'Home' });
	document.querySelector('.filter-container').innerHTML = View.tmpl('/index/filter.html');
	View.active('[href="/"]');
	View.active('.filter-container .' + t);

	if (!Me.id) {
	    View.trigger('help');
	}
	
    });

})();
