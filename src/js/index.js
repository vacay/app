/* global page, Prescription, document, Log, View */
(function() {

    page('/', function() {

	var offset = 0;
	
	var load = function() {
	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');

	    Prescription.browse({ offset: offset }, function(err, prescriptions) {
		if (err) {
		    Log.error(err);
		    //TODO - loading error
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

	if (!Me.id) {
	    View.trigger('help');
	}
	
    });

})();
