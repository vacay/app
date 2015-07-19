/* global View, document, Discussion, Log, page */
(function() {

    var index = function(ctx) {

	var offset = 0, closed = ctx.params.subpath === 'closed' ? true : false;
	var load = function(opts) {
	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');

	    if (opts) {
		document.querySelector('.filters .' + closed).classList.remove('active');

		r.dataset.loading = true;
		l.innerHTML = null;
		offset = 0;		
		closed = opts.reset ? false : opts.closed;

		document.querySelector('.filters .' + closed).classList.add('active');
	    } else {
		opts = {};
		if (closed) opts.closed = closed;
		opts.offset = offset;
	    }

	    Discussion.browse(opts, function(err, discussions) {
		if (err) Log.error(err);
		else {
		    if (discussions.length < 20) View.scrollOff();
		    offset += discussions.length;

		    var frag = document.createDocumentFragment();

		    discussions.forEach(function(d) {
			frag.appendChild(Discussion.render(d));
		    });

		    l.appendChild(frag);
		}

		delete r.dataset.loading;
	    });
	};

	View.render({
	    id: '/discussion/browse.html',
	    load: load,
	    filter: true
	});

	document.querySelector('.filter-container').classList.add('visible');
	document.querySelector('.filters').innerHTML = View.tmpl('/discussion/filter.html');

	document.querySelector('.filters .' + closed).classList.add('active');

	
    };

    page('/discussions/:subpath?', index);

})();
