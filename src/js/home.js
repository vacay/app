/* global document, View, page, Me, Elem, Page, Vitamin, Prescription, Log */
(function() {

    page('/home', function() {

	var lv, lp, t = 'all';

	var load = function(options) {

	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');

	    if (options) {
		document.querySelector('.filters .' + t).classList.remove('active');

		r.dataset.loading = true;
		lv = lp = l.innerHTML = null;
		t = options.reset ? 'all' : options.t;

		document.querySelector('.filters .' + t).classList.add('active');
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
				frag.appendChild(Elem.create({className: 'i-divider'}));
				var subscribed = [];
				items[i].pages.forEach(function(p) {
				    if (Me.isSubscribed('pages', p.id)) subscribed.push(p);
				});
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
	    id: '/home/index.html',
	    load: load,
	    filter: true
	});

	document.querySelector('.filter-container').classList.add('visible');
	document.querySelector('.filters').innerHTML = View.tmpl('/home/filter.html');

	document.querySelector('nav [href="/home"]').classList.add('active');
	document.querySelector('.filters .' + t).classList.add('active');

    });

})();
