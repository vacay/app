/* global */
(function() {

    page('/activity', function() {

	var t = 'mentions';
	var offset = 0, limit = 10;

	var load = function(opts) {

	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');
	    l.setAttribute('empty', 'You have no activity to show.');

	    if (opts) {
		document.querySelector('.filter-container .' + t).classList.remove('active');
		r.dataset.loading = true;
		l.innerHTML = null;
		offset = 0;

		if (opts.t) t = opts.t;
		View.active('.filter-container .' + t);
		View.scrollOn();
	    }

	    var response = function(err, items) {
		if (err) {
		    Log.error(err);
		    r.dataset.loadingError = true;
		    return;
		}

		if (items.length < limit) View.scrollOff();
		offset += items.length;

		var frag = document.createDocumentFragment();
		var i =0;
		for ( ; i < items.length; i++) {
		    frag.appendChild(Elem.create({className: 'i-divider'}));
		    if (t === 'mentions') {
			frag.appendChild(User.render(items[i].taggers[0], {
			    simple: true,
			    text: 'tagged you ' + Utils.fromNow(items[i].published_at),
			    className: 'i i-clear'
			}));
		    } else {
			frag.appendChild(User.render(items[i].publishers[0], {
			    simple: true,
			    text: 'crated ' + Utils.fromNow(items[i].published_at),
			    className: 'i i-clear'
			}));
		    }
		    frag.appendChild(Vitamin.render(items[i]));
		}

		l.appendChild(frag);

		delete r.dataset.loading;
	    };

	    var params = {
		limit: limit,
		offset: offset
	    };

	    switch(t) {
	    case 'mentions':
		Me.activity(params, response);
		break;

	    case 'crates':
		params.subscription_ids = Utils.pluck(Me.subscriptions.users);
		Vitamin.browse(params, response);
	    }
	};

	View.render({
	    load: load,
	    filter: true,
	    title: 'Activity'
	});
	document.querySelector('.filter-container').innerHTML = View.tmpl('/activity/filter.html');
	View.active('[href="/activity"]');
	View.active('.filter-container .' + t);
    });
})();
