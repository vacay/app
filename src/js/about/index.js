/* global View, page, Log, Discussion, document, Elem, showdown */
(function() {

    page('/about/:subpath?', function(ctx) {

	View.render({ className: 'u u650', title: 'About' });
	View.active('nav [href="/about"]');

	var r = document.getElementById('river');
	var l = r.querySelector('.list');

	View.github(ctx.params.subpath || 'README', function(err, content) {
	    if (err) {
		Log.error(err);
		r.dataset.loadingError = true;
		return;
	    }
	    var about = Elem.create({ className: '_m' });
	    var converter = new showdown.Converter();
	    about.innerHTML = converter.makeHtml(content);
	    r.insertBefore(Elem.create({
		className: 'h _d',
		    childs: [{
			tag: 'a',
			text: 'About'
		    }]
	    }), l);
	    r.insertBefore(about, l);
	});

	//TODO - load status

	Discussion.browse({
	    sticky: true
	}, function(err, discussions) {
	    if (err) {
		Log.error(err);
		r.dataset.loadingError = true;
		return;
	    }

	    var frag = document.createDocumentFragment();

	    if (discussions.length) {
		frag.appendChild(Elem.create({
		    className: 'h _d',
		    childs: [{
			tag: 'a',
			text: 'Announcements',
			attributes: {
			    href: '/discussions/open'
			}
		    }]
		}));

		discussions.forEach(function(d) {
		    frag.appendChild(Discussion.render(d));
		});
	    }

	    var more = Elem.create({
		tag: 'button',
		className: 'pull-right rnd success',
		text: 'see all discussions'
	    });

	    more.onclick = function() {
		page('/discussions/');
	    };

	    frag.appendChild(more);

	    l.appendChild(frag);
	    delete r.dataset.loading;
	});

    });

})();
