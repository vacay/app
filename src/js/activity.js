/* global */
(function() {

    page('/activity', function() {

	var offset = 0, limit = 10;

	var load = function() {

	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');
	    l.setAttribute('empty', 'You have no activity to show.');

	    Me.activity({
		limt: limit,
		offset: offset
	    }, function(err, items) {
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
		    frag.appendChild(User.render(items[i].taggers[0], {
			simple: true,
			text: 'tagged you ' + Utils.fromNow(items[i].published_at),
			className: 'i i-clear'
		    }));
		    frag.appendChild(Vitamin.render(items[i]));
		}

		l.appendChild(frag);

		delete r.dataset.loading;
	    });
	};

	View.render({
	    load: load,
	    title: 'Activity'
	});

	View.active('[href="/activity"]');	

    });
})();
