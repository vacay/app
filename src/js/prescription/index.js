/* global Prescription, page, View, document */
(function() {

    var load = function(ctx, next) {
	Prescription.read(ctx.params.id, function(err, prescription) {
	    if (err) {
		page('/');
	    } else {
		ctx.state.prescription = prescription;
		ctx.save();
		next();
	    }
	});
    };

    var show = function(ctx) {

	View.render({id: '/prescription/read.html'});

	View.scrollOff();

	var prescription = Prescription.render(ctx.state.prescription, { single: true });

	document.getElementById('prescription').appendChild(prescription);

	delete document.getElementById('river').dataset.loading;

    };

    page('/prescription/:id', load, show);

})();
