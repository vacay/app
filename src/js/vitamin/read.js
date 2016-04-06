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
	    
	    View.scrollOff();

	    var frag = document.createDocumentFragment();

	    if (ctx.state.vitamin.artists.length) {
		frag.appendChild(Elem.create({
		    className: 'h _d',
		    childs: [{
			tag: 'a',
			text: 'Artists'
		    }]
		}));
		ctx.state.vitamin.artists.forEach(function(a) {
		    frag.appendChild(Artist.render(a));
		});
	    }

	    if (ctx.state.vitamin.prescribers.length) {
		frag.appendChild(Elem.create({
		    className: 'h _d',
		    childs: [{
			tag: 'a',
			text: 'Prescribers'
		    }]
		}));
		ctx.state.vitamin.prescribers.forEach(function(u) {
		    frag.appendChild(User.render(u, { subscribe: true, bio: true }));
		});
	    }

	    if (ctx.state.vitamin.craters.length) {
		frag.appendChild(Elem.create({
		    className: 'h _d',
		    childs: [{
			tag: 'a',
			text: 'Craters'
		    }]
		}));
		ctx.state.vitamin.craters.forEach(function(u) {
		    frag.appendChild(User.render(u, { subscribe: true, bio: true }));
		});
	    }

	    if (ctx.state.vitamin.pages.length) {
		frag.appendChild(Elem.create({
		    className: 'h _d',
		    childs: [{
			tag: 'a',
			text: 'Pages'
		    }]
		}));
		ctx.state.vitamin.pages.forEach(function(p) {
		    frag.appendChild(Page.render(p, { subscribe: true, meta: true }));
		});
	    }

	    if (ctx.state.vitamin.prescriptions.length) {
		frag.appendChild(Elem.create({
		    className: 'h _d',
		    childs: [{
			tag: 'a',
			text: 'Prescriptions'
		    }]
		}));
		ctx.state.vitamin.prescriptions.forEach(function(p) {
		    frag.appendChild(Prescription.render(p));
		});
	    }

	    l.appendChild(frag);

	    delete r.dataset.loading;
	};

	View.render({
	    id: '/vitamin/read.html',
	    load: load
	});

	document.getElementById('vitamin').appendChild(Vitamin.render(ctx.state.vitamin));
    };

    page('/vitamin/:id/:subpath?', init, read);

})();
