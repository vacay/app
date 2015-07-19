/* global page, setTimeout, Location, Platform, View, Auth, Elem, window, document */
page('/landing', function() {

    var resetToken, inviteToken;
    var m = View.main;

    View.render({ id: '/landing.html' });

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

    var search = Location.search();

    if (search.inviteToken) {
	container.dataset.dataType = 'invite';
	inviteToken = search.inviteToken;
    } else if (search.resetToken) {
	container.dataset.type = 'reset';
	resetToken = search.resetToken;
    } else {
	container.dataset.type = 'signin';
    }

    var setInvalid = function(message) {
	if (!message) return;
	auth_message.innerHTML = message;
	auth_message.classList.add('shake');
	setTimeout(function() {
	    auth_message.classList.remove('shake');
	}, 2000);
    };
    
    form.onsubmit = function() {
	var type = container.dataset.type;
	var user = {
	    email: m.querySelector('#email').value,
	    password: m.querySelector('#password').value,
	    username: m.querySelector('#username').value,
	    name: m.querySelector('#name').value
	};

	var cb = function(err) {
	    setInvalid(err.data);
	};

	if (!user.email) return false;

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

});

(function (root, factory) {

    root.Landing = factory(root);

})(this, function () {

    'use strict';

    var m = View.main;

    var set = function(type) {
	var container = m.querySelector('.auth-container');
	var pws = m.querySelectorAll('input[type="password"]');
	Elem.each(pws, function(elem) {
	    elem.value = null;
	});
	
	container.setAttribute('data-type', type);
    };

    return {
	set: set
    };

});
