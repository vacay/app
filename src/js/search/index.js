/* global page, Location, Page, Vitamin, Search, Prescription, Artist, User, Elem, View, Log, document, Utils */
(function() {

    var init = function(ctx, next) {
	var params = Location.search(ctx.querystring);
	var query = params.q;

	if (!query) {
	    next();
	    return;
	}

	Search.query('count', {
	    q: query
	}, function(err, data) {
	    if (err) {
		Log.error(err);
		next();
		return;
	    }

	    data.query = query;
	    ctx.state.search = data;
	    ctx.save();
	    next();
	});
    };

    var read = function(ctx) {

	console.log(ctx);

	var offset = 0;

	var load = function() {

	    var params = Location.search(ctx.querystring);
	    var query = params.q;

	    var r = document.getElementById('river');

	    if (!query) {

		View.scrollOff();
		delete r.dataset.loading;

		return;
	    }

	    var input = document.getElementById('search').firstChild;
	    input.value = query || '';

	    var l = r.querySelector('.list');

	    var subpath = ctx.params.subpath || 'top';

	    if (Utils.isUrl(query) && subpath === 'top') {
		Page.create(query, function(err, page) {
		    if (err) {
			Log.error(err);
			r.dataset.loadingError = true;
			return;
		    }

		    var frag = document.createDocumentFragment();
		    frag.appendChild(Page.render(page, { subscribe: true }));

		    page.vitamins.forEach(function(v) {
			frag.appendChild(Vitamin.render(v));
		    });

		    l.appendChild(frag);

		    View.scrollOff();
		    delete r.dataset.loading;
		});
	    } else if (query) {
		Search.query(subpath, {
		    offset: offset,
		    q: query,
		    limit: subpath === 'top' ? 5 : 10
		}, function(err, data) {
		    if (err) {
			Log.error(err);
			r.dataset.loadingError = true;
			return;
		    }

		    var frag = document.createDocumentFragment();

		    if (data.length && subpath === 'top') {
			frag.appendChild(Elem.create({
			    className: 'h _d',
			    childs: [{
				tag: 'a',
				text: 'Top Results'
			    }]
			}));
		    }

		    var handler;

		    switch(subpath) {
		    case 'top':
			handler = function(i) {
			    if (typeof i.duration !== 'undefined') {
				frag.appendChild(Vitamin.render(i));
			    } else if (i.url) {
				frag.appendChild(Page.render(i, { subscribe: true }));
			    } else if (i.description) {
				frag.appendChild(Prescription.render(i));
			    } else if (i.username) {
				frag.appendChild(User.render(i, { subscribe: true, bio: true }));
			    } else if (typeof i.artist_city !== 'undefined') {
				frag.appendChild(Artist.render(i));
			    }
			    frag.appendChild(Elem.create({className: 'i-divider'}));
			};
			break;
		    case 'artists':
			handler = function(i) {
			    frag.appendChild(Artist.render(i));
			};
			break;
		    case 'pages':
			handler = function(i) {
			    frag.appendChild(Page.render(i, { subscribe: true }));
			};
			break;
		    case 'users':
			handler = function(i) {
			    frag.appendChild(User.render(i, { subscribe: true, bio: true }));
			};
			break;
		    case 'prescriptions':
			handler = function(i) {
			    frag.appendChild(Prescription.render(i));
			};
			break;
		    case 'vitamins':
			handler = function(i) {
			    frag.appendChild(Vitamin.render(i));
			};
			break;
		    }

		    data.forEach(handler);

		    if (data.length < 10 || subpath === 'top') View.scrollOff();
		    offset += data.length;

		    if (!data.length) l.setAttribute('empty', 'no results');

		    l.appendChild(frag);
		    
		    delete r.dataset.loading;
		});
	    } else {
		delete r.dataset.loading;
	    }
	};

	View.render({
	    id: '/search.html',
	    data: ctx.state.search || {},
	    load: load
	});

	var form = document.getElementById('search');
	var input = form.firstChild;

	View.active('[href="/search"]');

	form.onsubmit = function() {

	    var search = input.value;

	    page('/search/top?q=' + encodeURIComponent(search));

	    return false;
	};

	input.focus();
    };

    page('/search/:subpath?', init, read);

})();
