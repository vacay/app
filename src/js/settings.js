/* global Elem, Log, Discussion, User, Me, page, View, document */
(function() {

    var emailRe = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var usernameRe = /^\w+$/;

    function validateEmail(email) {
	return emailRe.test(email);
    }

    function validateUsername(str) {
	return usernameRe.test(str);
    }

    page('/settings', function() {

	View.render({ title: 'Settings' });

	var r = document.getElementById('river');
	var l = r.querySelector('.list');

	var actions = Elem.create({ className: 'right' });

	var save = Elem.create({
	    tag: 'button',
	    className: 'rnd sm success save',
	    text: 'save',
	    parent: actions
	});

	var edit = Elem.create({
	    tag: 'button',
	    className: 'rnd sm edit',
	    text: 'edit',
	    parent: actions
	});

	var onsave = function(e) {
	    var p = Elem.getClosest(e.target, '.i');
	    var input = p.querySelector('input');

	    var setInvalid = function(msg) {
		p.dataset.invalid = msg;
	    };

	    if (input.name === 'email' && !validateEmail(input.value)) {
		setInvalid('invalid email');
		return;
	    }

	    if (input.name === 'username' && !validateUsername(input.value)) {
		setInvalid('invalid username format: only letters and numbers');
		return;
	    }

	    var params = {};
	    params[input.name] = input.value;

	    User.update(params, function(err) {
		if (err) {
		    setInvalid(err);
		} else {
		    delete p.dataset.invalid;
		    p.classList.remove('editable');
		    input.disabled = true;
		}
	    });
	};

	var onedit = function(e) {
	    var p = Elem.getClosest(e.target, '.i');
	    var input = p.querySelector('input');
	    var editable = !p.classList.contains('editable');

	    input.disabled = !editable;

	    if (editable) {
		e.target.innerHTML = 'cancel';
		input.dataset.prev = input.value;
		input.focus();
	    } else {
		e.target.innerHTML = 'edit';
		input.value = input.dataset.prev;
	    }

	    p.classList.toggle('editable', editable);
	};

	var btnswitch = Elem.create({
	    className: 'right btn-switch',
	    childs: [{
		tag: 'button',
		className: 'sm on',
		text: 'public'
	    }, {
		tag: 'button',
		className: 'sm off',
		text: 'private'
	    }]
	});

	var onswitch = function(e) {
	    var p = Elem.getClosest(e.target, '.i');
	    var s = p.querySelector('.btn-switch');

	    var params = {};
	    var prop = p.dataset.type;
	    var value = Me.data[prop] ? 0 : 1;
	    params[prop] = value;

	    s.classList.toggle('active', value);

	    User.update(params, function(err) {
		if (err) {
		    Log.error(err);
		    s.classList.toggle('active', !value);
		    Me.data[prop] = !value;
		}
	    });
	};

	var account = Elem.create({
	    className: 'c setting',
	    childs: [{
		tag: 'small',
		className: 'i',
		text: 'Account'
	    }]
	});

	var email = Elem.create({ className: 'i i-right' });
	var eb = Elem.create({
	    className: 'i-body',
	    childs: [{
		tag: 'h4',
		text: 'Your email'
	    }, {
		tag: 'input',
		attributes: {
		    type: 'email',
		    name: 'email',
		    value: Me.data.email,
		    disabled: true
		}
	    }]
	});
	email.appendChild(eb);
	email.appendChild(actions.cloneNode(true));
	email.querySelector('.edit').addEventListener('click', onedit);
	email.querySelector('.save').addEventListener('click', onsave);
	account.appendChild(email);

	var username = Elem.create({ className: 'i i-right username' });
	var ub = Elem.create({
	    className: 'i-body',
	    parent: username,
	    childs: [{
		tag: 'h4',
		text: 'Your username'
	    }, {
		tag: 'span',
		text: 'https://vacay.io/@'
	    }, {
		tag: 'input',
		attributes: {
		    type: 'text',
		    name: 'username',
		    value: Me.data.username,
		    disabled: true
		}
	    }]
	});
	username.appendChild(actions.cloneNode(true));
	username.querySelector('.edit').addEventListener('click', onedit);
	username.querySelector('.save').addEventListener('click', onsave);
	account.appendChild(username);

	l.appendChild(account);

	var privacy = Elem.create({
	    className: 'c setting',
	    childs: [{
		tag: 'small',
		className: 'i',
		text: 'Privacy'
	    }]
	});

	var crate = Elem.create({
	    className: 'i i-right',
	    parent: privacy
	});
	crate.dataset.type = 'public_crate';
	var cb = Elem.create({
	    className: 'i-body',
	    parent: crate,
	    childs: [{
		tag: 'h4',
		text: 'Crate'
	    }, {
		tag: 'span',
		text: 'Control whether or not your crate is viewable to other people on the site'
	    }]
	});
	var cswitch = btnswitch.cloneNode(true);
	cswitch.classList.toggle('active', Me.data.public_crate);
	cswitch.addEventListener('click', onswitch);
	crate.appendChild(cswitch);

	var history = Elem.create({
	    className: 'i i-right'
	});
	history.dataset.type = 'public_listens';
	var hb = Elem.create({
	    className: 'i-body',
	    childs: [{
		tag: 'h4',
		text: 'Listening history'
	    }, {
		tag: 'span',
		text: 'Control whether or not your listening history is viewable to other people on the site'
	    }]
	});
	history.appendChild(hb);
	var hswitch = btnswitch.cloneNode(true);
	hswitch.classList.toggle('active', Me.data.public_listens);
	hswitch.addEventListener('click', onswitch);
	history.appendChild(hswitch);
	privacy.appendChild(history);

	l.appendChild(privacy);

	// notifications
	var notifications = Elem.create({
	    className: 'c setting',
	    childs: [{
		tag: 'small',
		className: 'i',
		text: 'Notifications'
	    }]
	});

	var activity = Elem.create({
	    className: 'i i-right',
	    parent: notifications
	});
	activity.dataset.type = 'activity';
	Elem.create({
	    className: 'i-body',
	    parent: activity,
	    childs: [{
		tag: 'h4',
		text: 'Activity'
	    }, {
		tag: 'span',
		text: 'Control whether or not you want to be notified when someone tags you'
	    }]
	});
	var activitySwitch = btnswitch.cloneNode(true);
	activitySwitch.querySelector('.on').innerHTML = 'on';
	activitySwitch.querySelector('.off').innerHTML = 'off';
	activitySwitch.classList.toggle('active', Me.data.activity);
	activitySwitch.addEventListener('click', onswitch);
	activity.appendChild(activitySwitch);

	var discussions = Elem.create({
	    className: 'i',
	    parent: notifications,
	    childs: [{
		tag: 'h4',
		text: 'Discussions'
	    }, {
		tag: 'span',
		text: 'These are the discussions you will be notified about when there are new comments.'
	    }]
	});

	var toggleWatch = function(e) {
	    var id = parseInt(Elem.getClosest(e.target, '.discussion').dataset.id, 10);
	    var isWatching = e.target.classList.contains('active');

	    var cb = function(err) {
		if (err) {
		    Log.error(err);
		    e.target.classList.toggle('active', isWatching);
		    e.target.innerHTML = isWatching ? 'watching' : 'watch';
		}
	    };

	    if (isWatching) {
		Discussion.unwatch(id, cb);
	    } else {
		Discussion.watch(id, cb);
	    }

	    e.target.innerHTML = !isWatching ? 'watching' : 'watch';
	    e.target.classList.toggle('active', !isWatching);
	};

	User.read(Me.username, 'watching', {}, function(err, items) {
	    if (err) {
		Log.error(err);
		return;
	    }

	    items.forEach(function(d) {
		var ele = Elem.create({
		    className: 'i i-right discussion',
		    childs: [{
			className: 'i-body i-title',
			tag: 'a',
			text: d.title,
			attributes: {
			    href: '/discussion/' + d.id
			}
		    }, {
			tag: 'button',
			className: 'sm rnd success right active',
			text: 'watching'
		    }]
		});
		ele.dataset.id = d.id;
		ele.querySelector('button').onclick = toggleWatch;
		notifications.appendChild(ele);
	    });
	});

	l.appendChild(notifications);
	View.scrollOff();
	View.active('[href="/settings"]');
	delete r.dataset.loading;
    });

})();
