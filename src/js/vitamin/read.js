/* global Vitamin, page, View, document, Log, User, Page, Artist, Elem */

(function() {

    var init = function(ctx, next) {
	Vitamin.read(ctx.params.id, null, null, function(err, vitamin) {
	    if (err) {
		page('/');
	    } else {
		ctx.state.vitamin = vitamin;
		ctx.save();
		next();
	    }
	});
    };

    var read = function(ctx) {

	var load = function() {
	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');
	    
	    Vitamin.read(ctx.params.id, null, null, function(err, data) {
		if (err) {
		    Log.error(err);
		} else {
		    View.scrollOff();

		    var frag = document.createDocumentFragment();

		    if (data.artists.length) {
			frag.appendChild(Elem.create({
			    className: 'h _d',
			    childs: [{
				tag: 'a',
				text: 'Artists'
			    }]
			}));
			data.artists.forEach(function(a) {
			    frag.appendChild(Artist.render(a));
			});
		    }

		    if (data.prescribers.length) {
			frag.appendChild(Elem.create({
			    className: 'h _d',
			    childs: [{
				tag: 'a',
				text: 'Prescribers'
			    }]
			}));
			data.prescribers.forEach(function(u) {
			    frag.appendChild(User.render(u, { subscribe: true, bio: true }));
			});
		    }

		    if (data.craters.length) {
			frag.appendChild(Elem.create({
			    className: 'h _d',
			    childs: [{
				tag: 'a',
				text: 'Craters'
			    }]
			}));
			data.craters.forEach(function(u) {
			    frag.appendChild(User.render(u, { subscribe: true, bio: true }));
			});
		    }

		    if (data.pages.length) {
			frag.appendChild(Elem.create({
			    className: 'h _d',
			    childs: [{
				tag: 'a',
				text: 'Pages'
			    }]
			}));
			data.pages.forEach(function(p) {
			    frag.appendChild(Page.render(p, { subscribe: true }));
			});
		    }

		    if (data.prescriptions.length) {
			frag.appendChild(Elem.create({
			    className: 'h _d',
			    childs: [{
				tag: 'a',
				text: 'Prescriptions'
			    }]
			}));
			data.prescriptions.forEach(function(p) {
			    frag.appendChild(Prescription.render(p));
			});
		    }

		    l.appendChild(frag);
		}

		delete r.dataset.loading;
	    });
	};

	View.render({
	    id: '/vitamin/read.html',
	    load: load
	});

	document.getElementById('vitamin').appendChild(Vitamin.render(ctx.state.vitamin));
    };

    page('/vitamin/:id/:subpath?', init, read);

})();
