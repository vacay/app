/* global */
(function() {

    page('/activity', function() {

	console.log('here');

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
		var last_user, i =0;
		for ( ; i < items.length; i++) {
		    if (last_user !== items[i].user_id) {
			frag.appendChild(Elem.create({className: 'i-divider'}));
			frag.appendChild(User.render(items[i].taggers[0]));
			last_user = items[i].user_id;
		    }
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
