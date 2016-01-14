/* global page, setTimeout, Location, Platform, View, Auth, Elem, window, document */
(function (root, factory) {

    root.Landing = factory(root);

})(this, function () {

    'use strict';

    var set = function(type) {
	var m = document.getElementById('landing');
	var container = m.querySelector('.auth-container');
	var pws = m.querySelectorAll('input[type="password"]');
	Elem.each(pws, function(elem) {
	    elem.value = null;
	});
	
	container.setAttribute('data-type', type);
    };

    var show = function(search) {
	search = search || {};
	var resetToken, inviteToken;

	var m = Elem.create({ html: View.tmpl('/landing.html')});

	if (Platform.isMobile()) {
	    var lan = document.getElementById('landing');
	    var gif;

	    if (Platform.isCordova())
		gif = 'hero.gif';
	    else
		gif = 'https://dl.dropboxusercontent.com/u/26745309/assets/videos/landing.gif';

	    lan.style['background-image'] = 'url(' + (gif) + ')';
	} else {
	    var video = m.querySelector('video');
	    if ((window.innerWidth / window.innerHeight) > (16 / 9))
		video.setAttribute('width', '100%');
	    else
		video.setAttribute('height', '100%');

	    var volume = m.querySelector('.volume-controls');
	    volume.onclick = function() {
		video.muted = !video.muted;
		volume.innerHTML = video.muted ? 'unmute' : 'mute';
	    };

	    video.load();
	    video.play();
	}

	var form = m.querySelector('form');
	var container = m.querySelector('.auth-container');
	var auth_message = m.querySelector('.auth-message');

	if (search.invite) {
	    container.dataset.dataType = 'invite';
	    inviteToken = search.invite;
	} else if (search.reset) {
	    container.dataset.type = 'reset';
	    resetToken = search.reset;
	} else {
	    container.dataset.type = 'signin';
	}

	form.onsubmit = function() {
	    var type = container.dataset.type;
	    var user = {
		email: m.querySelector('#email').value,
		password: m.querySelector('#password').value,
		username: m.querySelector('#username').value,
		name: m.querySelector('#name').value
	    };

	    var cb = function(err) {
		if (err && err.data) {
		    auth_message.innerHTML = err.data;
		    auth_message.classList.add('shake', 'error');
		    setTimeout(function() {
			auth_message.classList.remove('shake');
		    }, 2000);
		} else {
		    switch(type) {
		    case 'request':
			m.querySelector('#email').value	= null;
			auth_message.innerHTML = 'password reset email sent';
			break;
		    }
		}
	    };

	    if (!user.email) return false;
	    if (type !== 'request' && !user.password) return false;

	    switch(type) {
	    case 'signin':
		Auth.signin(user, cb);
		break;
	    case 'signup':
		Auth.signup(user, cb);
		break;
	    case 'invite':
		user.invite = inviteToken;
		Auth.signup(user, cb);
		break;
	    case 'reset':
		user.reset = resetToken;
		Auth.reset(user, cb);
		break;
	    case 'request':
		Auth.request(user.email, cb);
		break;
	    }

	    return false;
	};

	var opts = {
	    elem: m,
	    className: 'landing',
	    close: true
	};

	Modal.show(opts);

    };

    return {
	set: set,
	show: show
    };

});
