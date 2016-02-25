/* global document, View, page, Me, Elem, Page, Vitamin, Prescription, Log */
(function() {

    page('/inbox', function() {

	var lv = 0;

	var load = function() {

	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');
	    l.setAttribute('empty', 'You need to subscribe to pages. Learn how.');

	    Me.inbox({ lv: lv }, function(err, items) {
		if (err) {
		    Log.error(err);
		    r.dataset.loadingError = true;
		    return;
		}

		if (items.length < 50) View.scrollOff();

		var frag = document.createDocumentFragment();
		var previous_lv = lv;
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

		lv =  null;
		i = items.length - 1;
		for ( ; i >= 0; i--) {
		    if (!lv && items[i].page_id) lv = items[i].join_id;
		    if (lv) break;
		}

		if (!lv && previous_lv) lv = previous_lv;

		l.appendChild(frag);

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

	if (!Me.id) {
	    View.trigger('help');
	}

    });

})();
