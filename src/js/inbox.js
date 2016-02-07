/* global document, View, page, Me, Elem, Page, Vitamin, Prescription, Log */
(function() {

    page('/inbox', function() {

	var lv, lp, t = 'all';

	var load = function(options) {

	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');
	    l.setAttribute('empty', 'You need to subscribe to pages and users. Learn how.');

	    if (options) {
		document.querySelector('.filter-container .' + t).classList.remove('active');

		r.dataset.loading = true;
		lv = lp = l.innerHTML = null;
		t = options.reset ? 'all' : options.t;

		View.active('.filter-container .' + t);
	    } else {
		options = {};
		if (lv) options.lv = lv;
		if (lp) options.lp = lp;
		if (t) options.t = t;
	    }

	    Me.inbox(options, function(err, items) {
		if (err) Log.error(err);
		else {
		    if (items.length < 20) View.scrollOff();

		    var frag = document.createDocumentFragment();


		    var previous_lv = lv;
		    var previous_lp = lp;

		    var last_page, i =0;
		    for ( ; i < items.length; i++) {
			if (items[i].page_id) {
			    if (last_page !== items[i].page_id) {
				var subscribed = [];
				if (Me.id) {
				    items[i].pages.forEach(function(p) {
					if (Me.isSubscribed('pages', p.id)) subscribed.push(p);
				    });
				} else {
				    items[i].pages.sort(function(a, b) {
					return new Date(b._pivot_created_at) - new Date(a._pivot_created_at);
				    });
				    subscribed = items[i].pages;
				}
				frag.appendChild(Elem.create({className: 'i-divider'}));
				frag.appendChild(Page.render(subscribed[0]));
				last_page = subscribed[0].id;
			    }
			    frag.appendChild(Vitamin.render(items[i]));
			} else {
			    frag.appendChild(Elem.create({className: 'i-divider'}));
			    frag.appendChild(Prescription.render(items[i]));
			    last_page = null;
			}
		    }

		    lv = lp = null;
		    i = items.length - 1;
		    for ( ; i >= 0; i--) {
			if (!lv && items[i].page_id) lv = items[i].join_id;
			if (!lp && items[i].prescriber_id) lp = items[i].id;
			if (lv && lp) break;
		    }

		    if (!lv && previous_lv) lv = previous_lv;
		    if (!lp && previous_lp) lp = previous_lp;

		    l.appendChild(frag);
		}

		delete r.dataset.loading;
	    });
	};

	View.render({
	    load: load,
	    filter: true,
	    title: 'Inbox'
	});

	document.querySelector('.filter-container').innerHTML = View.tmpl('/inbox/filter.html');

	View.active('[href="/inbox"]');
	View.active('.filter-container .' + t);

	if (!Me.id) {
	    View.trigger('help');
	}

    });

})();
