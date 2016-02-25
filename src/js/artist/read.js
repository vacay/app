/* global page, Artist, View, Vitamin, document, Log, View, doT, Vitamins, window */
(function () {

    var init = function(ctx, next) {
	if (ctx.state.artist && ctx.state.artist.id === ctx.params.id) {
	    next();
	} else {
	    Artist.read(ctx.params.id, null, null, function(err, artist) {
		if (err) {
		    Log.error(err);
		    View.render();
		    document.getElementById('river').dataset.loadingError = true;
		} else {
		    ctx.state.artist = artist;
		    ctx.save();
		    next();
		}
	    });
	}
    };

    var read = function(ctx) {
	var offset = 0, headingLoaded, filterLoaded, q;
	var load = function(opts) {

	    var subpath = ctx.params.subpath || 'vitamins';
	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');

	    l.setAttribute('empty', ctx.state.artist.name + ' does not have any ' + subpath);

	    if (opts) {
		offset = 0;
		l.innerHTML = null;
		headingLoaded = false;

		if (typeof opts.q !== 'undefined') q = opts.q;

		if (opts.reset) {
		    document.querySelector('.filters input').value = q = null;
		}
	    }

	    var params = { offset: offset };
	    if (q) params.q = q;

	    Artist.read(ctx.params.id, subpath, params, function(err, data) {
		if (err) Log.error(err);
		else {
		    if (data.length < 10) View.scrollOff();
		    offset += data.length;

		    var frag = document.createDocumentFragment();

		    if (offset && !filterLoaded) {
			var f = document.querySelector('.filter-container');

			f.innerHTML = doT.template(View.tmpl('/filter/search.html'))({
			    placeholder: subpath
			});
			filterLoaded = true;
		    }

		    if (offset && !headingLoaded) {
			var shuffleParams = {
			    limit: 1,
			    order_by: 'rand'
			};

			if (params.q) shuffleParams.q = params.q;

			var heading = Vitamins.renderHeading({
			    shuffle: {
				title: '@' + ctx.state.artist.name + '\'s (artist) vitamins',
				path: '/artist/' + ctx.params.id + '/vitamins',
				params: shuffleParams
			    }
			});
			frag.appendChild(heading);

			headingLoaded = true;
		    }

		    data.forEach(function(d) {
			frag.appendChild(Vitamin.render(d));
		    });

		    l.appendChild(frag);
		}

		delete r.dataset.loading;
		View.active('.u [href="' + window.location.pathname + '"]');
	    });
	};
	
	View.render({
	    id: '/artist/read.html',
	    data: ctx.state.artist,
	    filter: true,
	    load: load
	});

	var artistElem = Artist.render(ctx.state.artist, { single: true });
	document.getElementById('artist').appendChild(artistElem);
    };

    page('/artist/:id/:subpath?', init, read);

})();
