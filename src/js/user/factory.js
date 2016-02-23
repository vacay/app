/* global Elem, WS, Utils, App, Player, Me, Identicon, CryptoJS, Log, Auth, User, Upload, Image, FileReader, Loading, Notification, page */
(function (root, factory) {

    root.User = factory(root);

})(this, function () {

    'use strict';

    return {
	render: function(data, opts) {
	    var self = this;
	    opts = opts || {};
	    var elem = Elem.create({
		tag: opts.avatarOnly ? 'span' : 'div',
		className: 'user'
	    });
	    elem.dataset.username = data.username;

	    var avatar = Elem.create({
		tag: opts.editable ? 'form' : 'a',
		className: 'avatar',
		attributes: {
		    href: '/@' + data.username
		},
		childs: [{
		    tag: 'img',
		    className: 'avatar-image-icon',
		    attributes: {
			src: this.getAvatar(data.username, data.avatar, opts.single ? 100 : 45)
		    }
		}]
	    });

	    elem.appendChild(avatar);

	    if (opts.avatarOnly) {
		avatar.title = data.username;

		if (opts.comment) {
		    var dis = Elem.create({
			tag: 'a',
			text: data.name
		    });
		    //TODO - href
		    var dos = Elem.create({
			tag: 'small',
			text: '  @' + data.username
		    });

		    dis.appendChild(dos);
		    elem.appendChild(dis);
		}

		if (opts.live) {
		    avatar.classList.add('t-left');
		    avatar.removeAttribute('href');
		    avatar.onclick = function() {
			if (avatar.classList.contains('active'))
			    Player.leave();
			else
			    Player.join('u:' + data.username);

		    };

		    avatar.classList.toggle('active', Player.data.room === 'u:' + data.username);

		    var play = Elem.create({
			tag: 'i',
			className: 'icon-play'
		    });

		    var pause = Elem.create({
			tag: 'i',
			className: 'icon-pause'
		    });
		    avatar.appendChild(play);
		    avatar.appendChild(pause);
		}
		return elem;
	    }

	    if (!opts.avatarOnly) {
		elem.classList.add('i', 'i-left');
		avatar.classList.add('left');
	    }

	    var body = Elem.create({ className: 'i-body' });
	    var o = {
		tag: opts.single ? 'h1' : 'a',
		attributes: {},
		text: data.name,
		className: 'i-title'
	    };

	    if (!opts.single) o.attributes.href = '/@' + data.username;
	    if (opts.editable) o.attributes.placeholder = 'Your name';

	    var name = Elem.create(o);
	    body.appendChild(name);

	    if (data.location || opts.editable) {
		var location = Elem.create({
		    tag: 'small',
		    text: data.location
		});
		if (opts.editable) location.setAttribute('placeholder', 'Your location');
		body.appendChild(location);
	    }

	    if ((opts.bio && data.bio) || opts.editable) {
		var bio = Elem.create({
		    tag: 'em',
		    text: data.bio
		});
		if (opts.editable) bio.setAttribute('placeholder', 'A Short bio.');
		body.appendChild(bio);
	    }

	    elem.appendChild(body);

	    if (opts.single) {
		var meta = Elem.create();

		var joined = Elem.create({
		    tag: 'small',
		    text: 'Joined ' + new Date(data.created_at).toDateString()
		});

		var seen = Elem.create({
		    tag: 'small',
		    text: 'Last seen ' + Utils.fromNow(data.last_visit)
		});

		meta.appendChild(joined);
		meta.appendChild(seen);
		elem.appendChild(meta);
	    }

	    if (Me.id && data.username !== Me.username) {
		if (opts.live) {

		    var isLive = Player.data.users.filter(function(u) {
			return u.username === data.username;
		    });

		    if (isLive.length) {
			var isListening = Player.data.room === 'u:' + data.username;
			var live = Elem.create({
			    tag: 'button',
			    className: 'rnd sm success' + (opts.single ? '' : ' right') + (isListening ? ' active' : ''),
			    text: isListening ? 'stop listening' : 'listen live'
			});

			live.onclick = function() {
			    if (live.classList.contains('active')) {
				Player.leave();
				live.innerHTML = 'listen live';
			    } else {
				Player.join('u:' + data.username);
				live.innerHTML = 'stop listening';
			    }

			    live.classList.toggle('active');
			};

			elem.classList.add('i-right');
			elem.appendChild(live);
		    }
		}

		if (opts.subscribe) {
		    var isSubscribed = Me.isSubscribed('users', data.id);
		    var btn = Elem.create({
			tag: 'button',
			className: 'rnd sm success',
			text: isSubscribed ? 'subscribed' : 'subscribe'
		    });
		    btn.onclick = function() {
			var cb = function(err) {
			    if (err) Log.error(err);
			};

			if (btn.classList.contains('active')) {
			    Me.unsubscribe('users', data, cb);
			} else {
			    Me.subscribe('users', data, cb);
			}
			btn.classList.toggle('active');
		    };
		    btn.classList.toggle('active', isSubscribed);

		    if (opts.single) {
			elem.appendChild(btn);
		    } else {
			elem.classList.add('i-right');
			btn.classList.add('pull-right');
			var right = Elem.create({ className: 'right' });
			right.appendChild(btn);
			elem.appendChild(right);
		    }
		}
	    }

	    if (opts.editable) {

		avatar.title = 'change';
		avatar.classList.add('upload');
		var input = Elem.create({
		    tag: 'input',
		    attributes: {
			type: 'file',
			value: 'image/*'
		    }
		});

		var l = Loading.render();
		avatar.appendChild(l);

		input.onchange = function(e) {

		    var minWidth = 100;

		    var fr = new FileReader();
		    fr.onload = function() {
			var img = new Image();
			img.onload = function() {
			    if (img.width >= minWidth) {

				var left = l.querySelector('.md-left .md-half-circle');
				var right = l.querySelector('.md-right .md-half-circle');
				var gap = l.querySelector('.md-gap');

				Upload.send(Utils.dataURItoBlob(fr.result), function(progress) {

				    var i = Math.floor(progress);

				    if (progress < 50) {
					left.style.transform = 'rotate(135deg)';
					right.style.transform = 'rotate(' + (i / 50 * 180 - 135) + 'deg)';
					gap.style.borderBottomColor = 'transparent';
				    } else {
					left.style.transform = 'rotate(' + ((i - 50) / 50 * 180 + 135) + 'deg)';
					right.style.transform = 'rotate(45deg)';
				    }

				    l.classList.toggle('show', i !== 0 && i !== 100);

				}, function(path) {

				    avatar.querySelector('img').src = path;

				    User.update({
					avatar: path
				    }, function(err) {
					if (err) {
					    Log.error(err);
					    avatar.querySelector('img').src = this.getAvatar(data.username, data.avatar, opts.single ? 100 : 45);
					    Notification.show({msg: 'Unable to update avatar. reverted back'});
					}
				    });
				});

			    } else {
				Notification.show({msg: 'image must be at least ' + minWidth + 'px wide'});
			    }
			};
			img.src = fr.result;
		    };
		    fr.readAsDataURL(e.target.files[0]);
		};

		avatar.appendChild(input);

		var edit = Elem.create({
		    tag: 'button',
		    className: 'rnd sm edit',
		    text: 'Edit Profile'
		});

		var save = Elem.create({
		    tag: 'button',
		    className: 'rnd sm success save',
		    text: 'Save'
		});

		save.onclick = function(e) {
		    //TODO - validate

		    self.update({
			name: Elem.text(name),
			location: Elem.text(location),
			bio: Elem.text(bio)
		    }, function(err) {
			if (err) Log.error(err);
		    });

		    edit.innerHTML = 'Edit Profile';
		    var divs = body.querySelectorAll('*');
		    Elem.each(divs, function(div) {
			div.contentEditable = 'false';
		    });

		    e.target.parentNode.classList.toggle('editable', false);
		};

		edit.onclick = function(e) {
		    var editable = !e.target.parentNode.classList.contains('editable');
		    var divs = body.querySelectorAll('*');

		    if (editable) {
			e.target.innerHTML = 'Cancel';
			Elem.each(divs, function(div) {
			    div.contentEditable = 'true';
			    div.dataset.prev = Elem.text(div);
			});
		    } else {
			e.target.innerHTML = 'Edit Profile';
			Elem.each(divs, function(div) {
			    div.contentEditable = 'false';
			    div.innerHTML = div.dataset.prev;
			});
		    }

		    e.target.parentNode.classList.toggle('editable', editable);
		};

		elem.appendChild(save);
		elem.appendChild(edit);
	    }

	    return elem;
	},

	browse: function(params, cb) {
	    App.api('/users').get(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res.data, null);
	    });
	},

	read: function(username, subpath, params, cb) {
	    var url = '/user/' + username;
	    if (subpath) url += '/' + subpath;
	    App.api(url).get(params).success(function(response) {
		cb(null, response.data);
	    }).error(function(data, res) {
		cb(res, null);
	    });
	},

	update: function(data, cb) {
	    App.api('/user/' + Me.username).put(data).success(function(res) {

		if (res.data.email) Me.data.email = res.email;
		if (typeof res.data.public_listens !== 'undefined') Me.data.public_listens = res.data.public_listens;
		if (typeof res.data.public_crate !== 'undefined') Me.data.public_crate = res.data.public_crate;

		if (res.token) {
		    WS.emit('token', {
			username: res.data.username,
			token: res.token
		    });

		    Auth.setToken(data.token);
		    Me.username = Me.data.username = res.data.username;
		    Me.updateUI();
		    WS.connect();
		}

		cb(null, res.data);
	    }).error(function(response) {
		cb(response.data || 'failed to load', null);
	    });
	},

	getAvatar: function(username, avatar, size) {
	    if (!avatar) {
		var data = new Identicon(CryptoJS.MD5(username).toString(), size, 0.05625).toString();
		return 'data:image/png;base64,' + data;
	    } else if (avatar.indexOf('/tmp') === -1) {
		return avatar.replace('-original', '-' + size + 'x' + size);
	    } else {
		return '';
	    }
	}
    };

});
