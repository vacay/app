/* global page, Prescription, document, Log, View */
(function() {

    page('/', function() {

	var t = 'featured', offset = 0;
	
	var load = function(opts) {
	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');

	    var params = {};

	    if (opts) {
		document.querySelector('.filter-container .' + t).classList.remove('active');
		r.dataset.loading = true;
		l.innerHTML = null;
		offset = 0;
		if (opts.t) t = opts.t;
		View.active('.filter-container .' + t);
	    }

	    params.offset = offset;
	    params.featured = t === 'featured';

	    Prescription.browse(params, function(err, prescriptions) {
		if (err) Log.error(err);
		else {
		    if (prescriptions.length < 10) View.scrollOff();
		    offset += prescriptions.length;

		    var frag = document.createDocumentFragment();
		    frag.appendChild(Elem.create({className: 'i-divider'}));

		    prescriptions.forEach(function(p) {
			frag.appendChild(Prescription.render(p));
		    });

		    l.appendChild(frag);
		}

		delete r.dataset.loading;
	    });
	};

	View.render({ load: load, filter: true });
	document.querySelector('.filter-container').innerHTML = View.tmpl('/index/filter.html');
	View.active('[href="/"]');
	View.active('.filter-container .' + t);

	if (!Me.id) {
	    View.trigger(document.querySelector('.help'), 'help');
	}
	
    });

})();
