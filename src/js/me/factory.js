/* global User, WS, document, App, Offline, Elem, Utils, page, Platform */
(function(root, factory) {

    root.Me = factory(root);

})(this, function() {

    'use strict';

    return {
	id: null,
	username: null,
	avatar: null,
	data: null,
	subscriptions: {
	    users: [],
	    groups: [],
	    artists: [],
	    pages: []
	},

	updateUI: function() {
	    var url = '/@' + this.username;
	    var p = document.querySelector('#user-icon');
	    p.innerHTML = null;

	    if (this.avatar) {
		var avatar = Elem.create();
		avatar.style.background = 'url(' + this.avatar + ') 50% 50% no-repeat';
		p.appendChild(avatar);
	    }

	    var crate_btn = Elem.create({ tag: 'a', text: url.substring(1)});
	    crate_btn.href = url + '/crate';
	    p.appendChild(crate_btn);

	    var drafts_btn = Elem.create({ tag: 'a', text: 'drafts' });
	    drafts_btn.href = url + '/drafts';
	    p.appendChild(drafts_btn);

	    if (Platform.isNative()) {
		var offline_btn = Elem.create({ tag: 'a', text: 'offline' });
		offline_btn.href = '/offline';
		p.appendChild(offline_btn);
	    }

	    document.querySelector('#previous a').href = url + '/listens';
	},

	init: function (res, intro) {
	    this.ip = res.client_ip;

	    var user = res.data;
	    this.id = user.id;
	    this.username = user.username;
	    this.avatar = User.getAvatar(user.username, user.avatar, 100);
	    this.subscriptions.users = user.users;
	    this.subscriptions.groups = user.groups;
	    this.subscriptions.pages = user.pages;
	    this.subscriptions.artists = user.artists;
	    this.tags = user.tags;

	    this.data = user;
	    delete this.data.users;
	    delete this.data.groups;
	    delete this.data.pages;
	    delete this.data.artists;
	    delete this.data.tags;

	    WS.connect();

	    var btn = document.getElementById('auth-btn');
	    btn.innerHTML = 'Log out';
	    btn.onclick = function() { Auth.signout(); };
	    document.body.classList.toggle('no-auth', false);

	    this.updateUI();
	    Modal.closeAll();

	    if (Platform.isNative()) Offline.init();
	},

	deauthenticate: function() {
	    this.id = this.avatar = this.username = this.data = null;
	    this.subscriptions = {
		users: [],
		artists: [],
		groups: [],
		pages: []
	    };

	    document.querySelector('#user-icon').innerHTML = null;
	    document.body.classList.toggle('no-auth', true);

	    var btn = document.getElementById('auth-btn');
	    btn.innerHTML = 'log in';
	    btn.onclick = function() { Landing.show(); };
	},

	toggle: function(e) {
	    var data = Elem.getClosest(e.target, '[data-id]').dataset;
	    var isSubscribed = e.target.classList.contains('active');
	    var divs = document.querySelector('[data-id="' + data.id + '"][data-type="' + data.type + '"] .subscribe');

	    Elem.each(divs, function(div) {
		div.classList.toggle('active', !isSubscribed);
		div.textContent = !isSubscribed ? 'subscribe': 'subscribed';
	    });

	    var cb = function(err) {
		if (err) {
		    Elem.each(divs, function(div) {
			div.classList.toggle('active', isSubscribed);
			div.textContent = isSubscribed ? 'subscribed' : 'subscribe';
		    });
		}
	    };

	    if (isSubscribed) this.unsubscribe(data.type, data.id, cb);
	    else this.subscribe(data.type, data.id, cb);
	},

	isSubscribed: function(type, id) {
	    return Utils.exists(this.subscriptions[type], id);
	},	

	subscribe: function(type, data, cb) {

	    var self = this;

	    this.subscriptions[type].push(data);

	    var url = '/' + type.slice(0, - 1) + '/' + (type === 'users' ? data.username : data.id) + '/subscription';

	    App.api(url).post().success(function(res) {
		// $rootScope.$broadcast('inbox:refresh');
		cb(null, res.data);
	    }).error(function(res) {
		self.subscriptions[type].splice(Utils.find(self.subscriptions[type], data.id), 1);
		// $rootScope.$broadcast('user:subscriptions:update');
		cb(res.data || 'failed to create ' + type + ' subscription', null);
	    });

	    // $rootScope.$broadcast('user:subscriptions:update');

	},
	
	unsubscribe: function(type, data, cb) {

	    var self = this;

	    this.subscriptions[type].splice(Utils.find(this.subscriptions[type], data.id), 1);

	    var url = '/' + type.slice(0, - 1) + '/' + (type === 'users' ? data.username : data.id) + '/subscription';

	    App.api(url).del().success(function(res) {
		// $rootScope.$broadcast('inbox:refresh');
		cb(null, res.data);
	    }).error(function(res) {
		self.subscriptions[type].push(data);
		// $rootScope.$broadcast('user:subscriptions:update');
		cb(res.data || 'failed to create ' + type + ' subscription', null);
	    });

	},
	sync: function(params, cb) {
	    App.api('/me/sync').post(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res.data || 'failed to sync', null);
	    });
	},

	watching: function(cb) {
	    App.api('/me/watching').get().success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res.data || 'failed to load user watching', null);
	    });
	},
	
	inbox: function(options, cb) {
	    App.api('/me/inbox').get(options).success(function(data) {
		cb(null, data.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	getData: function() {
	    var user = Utils.clone(this.data);
	    delete user.email;
	    delete user.cover;
	    delete user.notification;
	    delete user.last_visit;
	    delete user.created_at;
	    delete user.update_at;
	    delete user.public_crate;
	    delete user.public_listens;

	    return user;
	}	
    };

});
