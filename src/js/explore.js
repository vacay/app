/* global page, Prescription, Elem, document, Log, View */
(function() {

    page('/explore', function() {

	var offset = 0;
	
	var load = function() {
	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');

	    Prescription.browse({
		offset: offset
	    }, function(err, prescriptions) {
		if (err) Log.error(err);
		else {
		    if (prescriptions.length < 10) View.scrollOff();
		    offset += prescriptions.length;

		    var frag = document.createDocumentFragment();		    

		    prescriptions.forEach(function(p) {
			frag.appendChild(Elem.create({className: 'i-divider'}));
			frag.appendChild(Prescription.render(p));
		    });

		    l.appendChild(frag);
		}

		delete r.dataset.loading;
	    });
	};

	View.render({
	    id: '/home/index.html',
	    load: load
	});

	document.querySelector('nav [href="/explore"]').classList.add('active');
	
    });

})();
