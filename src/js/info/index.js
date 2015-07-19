/* global View, page, Log, Discussion, document, Elem, showdown */
(function() {

    page('/info/:subpath?', function(ctx) {

	View.render();

	var r = document.getElementById('river');

	View.github(ctx.params.subpath || 'about', function(err, content) {
	    if (err) Log.error(err);
	    else {
		var about = Elem.create({ className: '_m' });
		var converter = new showdown.Converter();
		about.innerHTML = converter.makeHtml(content);
		r.appendChild(Elem.create({
		    className: 'h _d',
		    childs: [{
			tag: 'a',
			text: 'About'
		    }]
		}));
		r.appendChild(about);
	    }
	});

	//TODO - load status

	Discussion.browse({
	    sticky: true
	}, function(err, discussions) {
	    if (err) Log.error(err);
	    else {

		var l = r.querySelector('.list');

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

	    }
	});

    });

})();
