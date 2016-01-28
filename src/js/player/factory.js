/* global soundManager, youtubeManager, document, Queue, WS, Vitamin, Elem, window, Platform, Log, cordova, Network, App, User, Me, CONFIG, Image, localforage, UAParser, Notification, Auth, View */
(function(root, factory) {

    root.Player = factory(root);

})(this, function() {

    'use strict';

    var sm = soundManager,
	ym = youtubeManager,
	sb = document.getElementById('statusbar'),
	vol = document.querySelector('#volume input'),
	canvas = document.getElementById('waveform'),
	ctx = canvas.getContext('2d'),
	cleanup;

    var _event = (function () {
	var old = (window.attachEvent && !window.addEventListener),
	    _slice = Array.prototype.slice,
	    evt = {
		add: (old ? 'attachEvent' : 'addEventListener'),
		remove: (old ? 'detachEvent' : 'removeEventListener')
	    };

	function getArgs(oArgs) {
	    var args = _slice.call(oArgs),
		len = args.length;
	    if (old) {
		args[1] = 'on' + args[1]; // prefix
		if (len > 3) {
		    args.pop(); // no capture
		}
	    } else if (len === 3) {
		args.push(false);
	    }
	    return args;
	}

	function apply(args, sType) {
	    var element = args.shift(),
		method = [evt[sType]];
	    if (old) {
		element[method](args[0], args[1]);
	    } else {
		element[method].apply(element, args);
	    }
	}

	function add() {
	    apply(getArgs(arguments), 'add');
	}

	function remove() {
	    apply(getArgs(arguments), 'remove');
	}
	return {
	    add: add,
	    remove: remove
	};
    }());

    var P = {
	data: {
	    autoplay: false,
	    remote: null,
	    repeat: false,
	    mode: null,
	    room: null,
	    roomUsers: [],
	    users: [],
	    nowplaying: null,
	    playing: false,
	    loading: '0%',
	    position: '0%',
	    time: {},
	    volume: CONFIG.env === 'production' ? 90 : 0,
	    history: []
	},

	reset: function() {
	    this.data.remote = null;
	    this.data.room = null;
	    this.data.roomUsers = [];
	    this.data.users = [];

	    this.data.mode = null;

	    this.updateLiveUsers();
	    document.body.classList.toggle('remote', P.data.remote);
	},

	ytSound: null,
	smSound: null,

	lastSound: null,
	dragActive: false,
	dragExec: new Date(),
	dragTimer: null,
	pageTitle: document.title,
	lastWPExec: new Date(),
	lastWLExec: new Date(),

	getTime: function(nMSec, bAsString) {
	    // convert milliseconds to mm:ss, return as object literal or string
	    var nSec = Math.floor(nMSec / 1000),
		min = Math.floor(nSec / 60),
		sec = nSec - (min * 60);
	    // if (min === 0 && sec === 0) return null; // return 0:00 as null
	    return (bAsString ? (min + ':' + (sec < 10 ? '0' + sec : sec)) : {
		'min': min,
		'sec': sec
	    });
	},

	setPageTitle: function(sTitle) {
	    try {
		document.title = (sTitle ? sTitle + ' - ' : '') + P.pageTitle;
	    } catch (e) {
		P.setPageTitle = function () {
		    return false;
		};
	    }
	},

	setTime: function() {
	    P.data.time = {
		position: this.position,
		total: this.durationEstimate
	    };
	},

	updateArtwork: function(isYoutube) {
	    var artwork = document.getElementById('artwork');

	    artwork.style['background-image'] = null;
	    document.getElementById('yt-container').classList.toggle('hide', !isYoutube);

	    if (isYoutube) return;

	    var hosts = P.data.nowplaying.hosts;

	    for(var i=0; i<hosts.length; i++) {
		if (hosts[i].artwork_url) {
		    var url = hosts[i].artwork_url.indexOf('.sndcdn.com') === -1 ?
			    hosts[i].artwork_url :
			    hosts[i].artwork_url.replace('-large', '-t500x500');
		    artwork.style['background-image'] = 'url(' + url + ')';
		    break;
		}
	    }
	},

	updateNowplaying: function() {
	    // set mode if applicable
	    var l = document.querySelector('#nowplaying .list');
	    l.innerHTML = null;

	    // Mode
	    var header = document.querySelector('#nowplaying .p-header');
	    header.innerHTML = P.data.mode ?
		'Now playing ' + (P.data.mode.title.length > 25 ? P.data.mode.title.substring(0,25) + '...' : P.data.mode.title) :
		'Now playing';
	    if (P.data.mode) {
		var a = Elem.create({
		    tag: 'a',
		    className: 'pull-right',
		    text: 'Stop'
		});
		a.onclick = function() {
		    P.data.mode = null;
		    header.innerHTML = 'now playing';
		};
		header.appendChild(a);
	    }

	    // Nowplaying
	    l.appendChild(Vitamin.render(P.data.nowplaying));

	    this.updateArtwork();

	    // Vitamin Styling
	    var ds = document.querySelectorAll('.vitamin.nowplaying');
	    Elem.each(ds, function(div) {
		div.classList.remove('nowplaying');
	    });

	    var ns = document.querySelectorAll('.vitamin[data-id="' + P.data.nowplaying.id + '"]');
	    Elem.each(ns, function(div) {
		div.classList.add('nowplaying');
	    });
	},

	updateVolume: function(localOnly) {
	    var volume = parseInt(vol.value, 10);
	    if (P.data.volume !== volume) {
		P.data.volume = volume;
		if (P.lastSound) P.lastSound.setVolume(volume);
	    }

	    document.querySelector('.vol-val').style.width  = P.data.volume + '%';

	    if (!localOnly) {
		WS.emit('player:volume', {
		    volume: volume
		});
	    }
	},

	updateHistory: function(localOnly) {
	    var elem = document.querySelector('#previous .list');
	    elem.innerHTML = null;
	    elem.appendChild(Vitamin.render(P.data.history[P.data.history.length - 1]));

	    if (!localOnly) {
		WS.emit('player:history', P.data.history);
	    }
	},

	updateLive: function() {
	    document.body.classList.toggle('live', P.data.room);
	    canvas.classList.toggle('disabled', !!P.data.room);

	    var elem = document.querySelector('.p-live .list');
	    elem.innerHTML = null;

	    var divs = document.querySelectorAll('#live .user a');
	    Elem.each(divs, function(d) {
		d.classList.remove('active');
	    });

	    if (P.data.room) {
		if (P.data.room.charAt(0) === 'u') {
		    var user = P.data.users.filter(function(o) {
			return 'u:' + o.username === P.data.room;
		    })[0];
		    elem.appendChild(User.render(user, { live: true }));
		    View.active('#live .user[data-username="' + P.data.room.slice(2) + '"] a');
		} else {
		    var i = Elem.create({
			className: 'i i-right'
		    });

		    var body = Elem.create({
			className: 'i-body'
		    });
		    i.appendChild(body);

		    var p = Elem.create({
			tag: 'p',
			className: 'meta',
			text: P.data.room.slice(2)
		    });
		    body.appendChild(p);

		    var btn = Elem.create({
			tag: 'button',
			className: 'rnd sm success right active',
			text: 'leave room'
		    });
		    btn.onclick = P.leave;
		    i.appendChild(btn);

		    P.data.roomUsers.forEach(function(u) {
			body.appendChild(User.render(u, { avatarOnly: true }));
		    });

		    elem.appendChild(i);
		}
	    }
	},

	updateLiveUsers: function() {
	    var elem = document.getElementById('live');
	    elem.innerHTML = null;
	    var users = P.data.users.filter(function(u) { return u.username !== Me.username; });
	    users.forEach(function(u) {
		elem.appendChild(User.render(u, { avatarOnly: true }));
	    });
	},

	updateTime: function() {
	    document.getElementById('current-time').innerHTML = P.getTime(P.data.time.position, true);
	    document.getElementById('remaining-time').innerHTML = '-' + P.getTime(P.data.time.total - P.data.time.position, true);
	},

	updatePosition: function() {
	    sb.querySelector('.position').style.width = P.data.position;
	},

	updateLoading: function() {
	    sb.querySelector('.loading').style.width = P.data.loading;
	},

	updateAutoplay: function() {
	    document.querySelector('#autoplay .btn-switch').classList.toggle('active', P.data.autoplay);
	},

	updateRepeat: function() {
	    document.querySelector('.p-ctrls .repeat').classList.toggle('active', P.data.repeat);
	},
	
	events: {
	    play: function () {
		P.data.playing = true;
		document.body.classList.toggle('playing', P.data.playing);

		P.setPageTitle('\u25B6');
		canvas.width = window.innerWidth;

		WS.emit('player:status', {
		    playing: P.data.playing,
		    id: this._data.vitamin.id
		});

		if (this._data.vitamin.processed_at) {
		    var waveformPath = 'https://s3.amazonaws.com/vacay/' + CONFIG.env + '/waveforms/' + this._data.vitamin.id + '.png';
		    var imageObj = new Image();
		    imageObj.crossOrigin = 'Anonymous';
		    imageObj.onload = function() {
			ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
		    };
		    imageObj.src = waveformPath;
		} else {
		    ctx.clearRect(0,0,canvas.width,canvas.height);
		}
	    },
	    stop: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;

		P.data.playing = false;
		document.body.classList.toggle('playing', P.data.playing);

		P.data.position = '0%';
		P.updatePosition();
		P.setPageTitle();

		WS.emit('player:status', {
		    playing: P.data.playing,
		    position: P.data.position,
		    id: this._data.vitamin.id
		});
	    },
	    pause: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;

		if (P.dragActive) return;
		P.data.playing = false;
		document.body.classList.toggle('playing', P.data.playing);
		P.setPageTitle('\u25FC');

		WS.emit('player:status', {
		    playing: P.data.playing,
		    id: this._data.vitamin.id
		});
	    },
	    resume: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;

		if (P.dragActive) return;
		P.data.playing = true;
		document.body.classList.toggle('playing', P.data.playing);
		P.setPageTitle('\u25B6');

		WS.emit('player:status', {
		    playing: P.data.playing,
		    id: this._data.vitamin.id
		});
	    },
	    finish: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;

		P.data.playing = false;
		document.body.classList.toggle('playing', P.data.playing);
		P.setPageTitle();

		if (!P.data.room) P.data.repeat ? P.repeat() : P.next();
	    },
	    whileloading: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;

		var self = this;
		function doWork() {
		    if (P.data.nowplaying.id === self._data.vitamin.id) {
			P.data.loading = ((self.bytesLoaded / self.bytesTotal) * 100) + '%';
			P.updateLoading();
		    }
		}
		
		var d = new Date();
		if (d && d - P.lastWLExec > 50 || this.bytesLoaded === this.bytesTotal) {
		    doWork.apply(this);
		    P.lastWLExec = d;
		}
	    },
	    onload: function (success) {
		if (!success && this.readyState === 2 && !this._data.reloaded) {

		    this._data.reloaded = true;

		    P.lastSound = null;

		    var idx = this._data.host.idx;

		    if (idx === -1) this._data.vitamin.loadError = true;
		    else this._data.vitamin.hosts[idx].loadError = true;

		    P.load(this._data.vitamin, true);
		}
	    },
	    whileplaying: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;

		var i, d = null;

		if (P.dragActive) {

		    P.data.position = ((this.position / this.durationEstimate) * 100) + '%';
		    P.setTime.apply(this);
		    P.updateTime();
		    P.updatePosition();

		} else {

		    d = new Date();

		    if (d - P.lastWPExec > 30) {

			if (window.remoteControls && cordova) {
			    var vitamin = this._data.vitamin;

			    var artist = '';
			    var title = vitamin.title || 'Unknown';
			    var album = '';
			    var image = 'icon.png'; //TODO - not working
			    var duration = this.durationEstimate / 1000;
			    var elapsedTime = this.position / 1000;

			    for (i=0; i<vitamin.hosts.length; i++) {
				if (vitamin.hosts[i].artwork_url) {
				    image = vitamin.hosts[i].artwork_url.indexOf('.sndcdn.com') === -1 ? vitamin.hosts[i].artwork_url : vitamin.hosts[i].artwork_url.replace('-large', '-t500x500');
				}
			    }

			    var params = [artist, title, album, image, duration, elapsedTime];

			    var completed = function(e) {
				Log.debug(e);
			    };

			    var failed = function(e) {
				Log.error(e);
			    };

			    cordova.exec(completed, failed, 'RemoteControls', 'updateMetas', params);
			}

			var progress = this.position / this.durationEstimate;

			if (this._data.vitamin.processed_at && progress) {

			    var progressWidth = progress * canvas.width;

			    try {

				var imageData = ctx.getImageData(0, 0, progressWidth, canvas.height);
				var data = imageData.data;
				for (i = 0; i < data.length; i += 4) {
				    data[i] = 211; // red
				    data[i + 1] = 228; // green
				    data[i + 2] = 120; // blue
				}
				ctx.putImageData(imageData, 0, 0);

				imageData = ctx.getImageData(progressWidth, 0, (canvas.width - progressWidth), canvas.height);
				data = imageData.data;
				for (i = 0; i < data.length; i += 4) {
				    data[i] = 200; // red
				    data[i + 1] = 200; // green
				    data[i + 2] = 200; // blue
				}
				ctx.putImageData(imageData, progressWidth, 0);

			    } catch (canvasError) {
				Log.warn(canvasError);
			    }
			}
			
			P.data.position = ( progress * 100) + '%';
			P.setTime.apply(this);
			P.updateTime();
			P.updatePosition();

			WS.emit('player:status', {
			    time: P.data.time,
			    playing: P.data.playing,
			    position: P.data.position,
			    loading: P.data.loading,
			    id: this._data.vitamin.id
			});

			P.lastWPExec = d;
		    }
		}
	    }
	},

	withinStatusBar: function (o) {
	    return (P.lastSound !== null && Elem.isChildOfClass(o, 'statusbar-container'));
	},

	join: function(room) {
	    P.data.mode = null;
	    P.data.room = room;
	    P.updateLive();

	    WS.emit('join', { room: room, user: Me.getData() });
	},

	leave: function() {
	    P.data.room = null;
	    P.updateLive();
	    WS.emit('leave');
	},

	playId: function(id) {
	    Vitamin.read(id, null, null, function(err, vitamin) {
		if (err) {
		    Log.error(err);
		} else {
		    P.play(vitamin);
		}
	    });
	},

	play: function (vitamin, mode) {
	    if (P.data.remote) {
		WS.emit('player:play', { vitamin: vitamin, mode: mode });
		return;
	    }

	    if (P.data.room && P.data.room.charAt(0) === 'u')
		P.leave();

	    P.data.mode = mode;

	    if (mode) {
		P.loadMode();
		return;
	    }

	    if (vitamin instanceof Array) {
		var vitamins = JSON.parse(JSON.stringify(vitamin));
		var first = vitamins.shift();
		Queue.addNext(vitamins);
		P.load(first, true);
	    } else if (vitamin || P.data.nowplaying) {
		P.load(vitamin || P.data.nowplaying, true);
	    } else if (Queue.vitamins[0]) {
		P.load(Queue.getNext(), true);
	    }
	},

	stop: function() {
	    var sound = P.lastSound;

	    if (!sound) return;

	    if (!sound.videoId) sm.stop(sound.id);
	    else sound.stop();
	},

	toggleRepeat: function() {
	    P.data.repeat = !P.data.repeat;

	    P.updateRepeat();

	    WS.emit('player:repeat', {
		repeat: P.data.repeat
	    });
	},

	toggleAutoplay: function() {
	    P.data.autoplay = !P.data.autoplay;

	    P.updateAutoplay();

	    WS.emit('player:autoplay', {
		autoplay: P.data.autoplay
	    });
	},

	repeat: function() {
	    P.load(P.data.nowplaying, true);
	},

	next: function () {
	    if (P.data.remote) {
		WS.emit('player:next');
		return;
	    }

	    if (P.data.room && P.data.room.charAt(0) === 'u')
		P.leave();

	    if (Queue.vitamins[0]) {
		P.load(Queue.getNext(), true);
	    } else if (P.data.mode) {
		P.loadMode();
	    } else if (P.data.autoplay) { //TODO - not during P.data.room
		var username = Me.username;
		User.read(username, 'crate', {
		    limit: 1,
		    order_by: 'rand'
		}, function(err, vitamins) {
		    if (err) Log.error(err);
		    if (vitamins.length) {
			P.load(vitamins[0], true);
		    } else {
			P.toggleAutoplay();
		    }
		});
	    }
	},

	previous: function () {
	    if (P.data.remote) {
		WS.emit('player:previous');
		return;
	    }

	    if (P.data.room && P.data.room.charAt(0) === 'u') P.leave();

	    if (!P.lastSound || !P.data.history.length ) return;

	    if (P.lastSound.position > 3000) {
		P.lastSound.setPosition(0);
		P.lastSound.resume();
	    } else if (P.data.history.length) {
		//TODO - use persisted history

		Queue.addNext(P.data.nowplaying);
		P.load(P.data.history.pop(), false);
		P.updateHistory();
	    }
	},

	loadMode: function() {
	    App.api(P.data.mode.path).get(P.data.mode.params).success(function(res) {
		if (P.data.mode.params.offset) P.data.mode.params.offset++;
		if (res.data.length) P.load(res.data[0], true);
	    }).error(function(res) {
		P.data.mode = null;
		var header = document.querySelector('#nowplaying .p-header');
		header.innerHTML = 'now playing';
		Log.error(res);
	    });
	},

	load: function(vitamin, createHistory, position) {
	    var soundURL, thisSound;

	    if (P.lastSound && P.lastSound._data.vitamin.id === vitamin.id) {


		// ..and was playing (or paused) and isn't in an error state
		if (P.lastSound.readyState !== 2) {
		    if (P.lastSound.playState !== 1) P.lastSound.play(); // not yet playing
		    else if (P.data.room) {
			if (position) P.lastSound.setPosition(position);
			if (P.lastSound.paused) P.lastSound.play();
		    } else P.lastSound.togglePause();
		} else {
		    sm._writeDebug('Warning: sound failed to load (security restrictions, 404 or bad format)', 2);
		}

	    } else {

		if (P.lastSound) {

		    P.lastSound.stop();

		    if (createHistory) {
			P.data.history.push(P.data.nowplaying);
			P.updateHistory();
		    }
		}

		P.data.nowplaying = vitamin;

		P.updateNowplaying();

		P.getStream(vitamin, function(err, host) {

		    if (err) {
			Log.error(err, { vitamin: vitamin });
			Notification.show({
			    msg: 'No stream currently available.',
			    action: {
				onclick: function() {},
				text: 'Ok'
			    }
			});
			//TODO - update vitamin data
			//TODO - update UI
			return;
		    }

		    soundURL = host.url;

		    if (soundURL.indexOf('youtube') !== -1) {
			thisSound = P.createYTSound(soundURL);
			P.updateArtwork(true);
		    } else {
			thisSound = P.createSMSound(soundURL);
		    }

		    thisSound._data = { vitamin: vitamin, host: host };

		    P.lastSound = thisSound;

		    thisSound.play();
		    if (position) thisSound.setPosition(position);

		    // analytics.track('play');
		    // record play count & history

		    if (Network.online) {
			WS.emit('player:nowplaying', {
			    nowplaying: P.data.nowplaying,
			    user: Me.getData(),
			    room: P.data.room,
			    mode: P.data.mode
			});
		    }
		});
	    }
	},

	getFile: function(vitamin, cb) {
	    if (Platform.isNative()) localforage.getItem(vitamin.id.toString()).then(cb);
	    else cb();
	},

	getHosts: function(vitamin, cb) {
	    if (vitamin.loadedHosts) {
		cb();
	    } else {
		Vitamin.read(vitamin.id, 'stream', {}, function(err, hosts) {
		    vitamin.loadedHosts = true;
		    if (!err) vitamin.hosts = hosts;
		    cb();
		});
	    }
	},

	chooseHost: function(vitamin, cb) {
	    var hosts = vitamin.hosts;

	    var getHostIdx = function(title) {
		var idx = -1;
		for (var h=0; h<hosts.length; h++) {
		    if (hosts[h].title === title && !hosts[h].loadError) {
			idx = h;
			break;
		    }
		}
		return idx;
	    };

	    var scIdx = getHostIdx('soundcloud');
	    var ytIdx = getHostIdx('youtube');

	    if (scIdx !== -1 && hosts[scIdx].stream_url) {
		return cb(null, {
		    url: hosts[scIdx].stream_url,
		    idx: scIdx
		});
	    } else if (ytIdx !== -1 && (!Platform.isMobile() || hosts[ytIdx].stream_url)) {
		return cb(null, {
		    url: hosts[ytIdx].url,
		    idx: ytIdx
		});
	    } else {
		for (var i=0; i<hosts.length; i++) {
		    if (!hosts[i].loadError && hosts[i].stream_url) {
			return cb(null, {
			    url: hosts[i].stream_url,
			    idx: i
			});
		    }
		}

		if (!vitamin.loadError && vitamin.processed_at) {
		    return cb(null, {
			url: 'https://s3.amazonaws.com/vacay/' + CONFIG.env + '/vitamins/' + vitamin.id + '.mp3',
			idx: -1
		    });
		} else {
		    return cb('no stream available');
		}
	    }
	},

	getStream: function(vitamin, cb) {
	    var self = this;
	    this.getFile(vitamin, function(f) {
		if (f && f.filename) {
		    cb(null, {
			url: f.filename,
			idx: -1
		    });
		} else {
		    self.getHosts(vitamin, function() {
			self.chooseHost(vitamin, cb);
		    });
		}
	    });
	},

	createYTSound: function(url) {
	    var options = {
		id: 'youtube',
		url: decodeURI(url),
		container: document.querySelector('#yt-container'),
		width: '100%',
		height: '100%',
		onplay: P.events.play,
		onstop: P.events.stop,
		onpause: P.events.pause,
		onresume: P.events.resume,
		onfinish: P.events.finish,
		whileloading: P.events.whileloading,
		whileplaying: P.events.whileplaying,
		onload: P.events.onload,
		volume: P.data.volume
	    };

	    P.ytSound ? P.ytSound.load(decodeURI(url)) : (P.ytSound = ym.createSound(options));

	    return P.ytSound;
	},

	createSMSound: function(url) {
	    var options = {
		id: 'vacay',
		position: 0,
		url: decodeURI(url),
		onplay: P.events.play,
		onstop: P.events.stop,
		onpause: P.events.pause,
		onresume: P.events.resume,
		onfinish: P.events.finish,
		whileloading: P.events.whileloading,
		whileplaying: P.events.whileplaying,
		onload: P.events.onload,
		volume: P.data.volume
	    };

	    P.smSound = P.smSound ? P.smSound.load(options) : sm.createSound(options);
	    return P.smSound;
	},

	handleMouseDown: function (e) {
	    if (P.data.room) return true;

	    if (Platform.isTouchDevice() && e.touches) {
		e = e.touches[0];
	    }

	    var o = Elem.getTheDamnTarget(e);
	    if (!o) return true;

	    if (!P.withinStatusBar(o)) return true;

	    P.dragActive = true;
	    P.lastSound.pause();
	    P.setPosition(e);
	    if (!Platform.isTouchDevice()) {
		_event.add(sb, 'mousemove', P.handleMouseMove);
	    } else {
		_event.add(sb, 'touchmove', P.handleMouseMove);
	    }
	    return P.stopEvent(e);
	},

	handleMouseMove: function (e) {
	    if (Platform.isTouchDevice() && e.touches) {
		e = e.touches[0];
	    }

	    if (P.dragActive) {
		var d = new Date();
		if (d - P.dragExec > 20) {
		    P.setPosition(e);
		} else {
		    window.clearTimeout(P.dragTimer);
		    P.dragTimer = window.setTimeout(function () {
			P.setPosition(e);
		    }, 20);
		}
		P.dragExec = d;
	    } else {
		P.stopDrag();
	    }
	    e.stopPropagation = true;
	    return false;
	},

	stopDrag: function (e) {
	    if (P.dragActive) {
		if (!Platform.isTouchDevice()) {
		    _event.remove(sb, 'mousemove', P.handleMouseMove);
		} else {
		    _event.remove(sb, 'touchmove', P.handleMouseMove);
		}
		if (P.data.playing) {
		    P.lastSound.resume();
		} else {
		    P.data.position = ((P.lastSound.position / P.lastSound.durationEstimate) * 100) + '%';
		    P.updatePosition();
		    WS.emit('player:status', {
			position: P.data.position,
			id: P.lastSound._data.vitamin.id
		    });
		}
		P.dragActive = false;
		P.stopEvent(e);
	    }
	},

	handleStatusClick: function (e) {
	    P.setPosition(e);
	    if (P.data.playing) {
		P.resume(); //this function may not exist?
	    }
	    return P.stopEvent(e);
	},

	stopEvent: function (e) {
	    if (typeof e !== 'undefined') {
		if (typeof e.preventDefault !== 'undefined') {
		    e.preventDefault();
		} else {
		    e.stopPropagation = true;
		    e.returnValue = false;
		}
	    }
	    return false;
	},

	setPosition: function (e) {
	    var oThis = Elem.getTheDamnTarget(e),
		x, oSb, oSound, nMsecOffset;
	    if (!oThis) {
		return;
	    }
	    oSb = oThis;
	    while (!oSb.classList.contains('statusbar-container') && oSb.parentNode) {
		oSb = oSb.parentNode;
	    }
	    oSound = P.lastSound;
	    x = parseInt(e.clientX, 10);
	    nMsecOffset = Math.floor((x - Elem.getOffX(oSb) - 4) / (oSb.offsetWidth) * oSound.durationEstimate);
	    if (!isNaN(nMsecOffset)) {
		nMsecOffset = Math.min(nMsecOffset, oSound.durationEstimate);
	    }
	    if (!isNaN(nMsecOffset)) {
		oSound.setPosition(nMsecOffset);
	    }
	},
	
	isPlaying: function(id) {
	    return (this.data.nowplaying && this.data.nowplaying.id === id) ? true: false;
	},

	setMaster: function() {
	    WS.emit('set:master');
	},

	init: function () {

	    sm._writeDebug('Sound.init(): Using default configuration');

	    function doEvents(action) { // action: add / remove
		if (!Platform.isTouchDevice()) {
		    _event[action](sb, 'mousedown', P.handleMouseDown);
		    _event[action](sb, 'mouseup', P.stopDrag);
		} else {
		    _event[action](sb, 'touchstart', P.handleMouseDown);
		    _event[action](sb, 'touchend', P.stopDrag);
		}
		_event[action](window, 'unload', cleanup);
	    }

	    cleanup = function () {
		doEvents('remove');
	    };
	    
	    doEvents('add');

	    if (window.remoteControls) {
		document.addEventListener('remote-event', function(event) {
		    var type = event.remoteEvent.subtype;
		    switch(type) {
		    case 'nextTrack':
			P.next();
			break;
		    case 'prevTrack':
			P.prev();
			break;
		    }
		});
	    }

	    vol.value = P.data.volume;
	    vol.addEventListener('change', function() {
		P.updateVolume();
	    });

	    var socketID = null;

	    var updateMaster = function(master, ua) {

		var isMaster = socketID === master;

		if (isMaster && P.data.remote && P.data.playing)
		    P.data.playing = false;
		else if (!isMaster && !P.data.remote  && P.data.playing)
		    P.stop();

		var parser = new UAParser();
		parser.setUA(ua);
		var result = parser.getResult();

		if (result.ua)
		    document.querySelector('.rc .meta').innerHTML = 'playing on ' + result.os.name + ' - ' + result.browser.name;

		P.data.remote = !isMaster;
		document.body.classList.toggle('remote', P.data.remote);
		Log.info('master: ', isMaster);
	    };

	    WS.on('token', function(data) {
		if (data.token) Auth.setToken(data.token);
		if (data.username) Me.username = Me.data.username = data.username;
		Me.updateUI();
		WS.connect();
	    });

	    WS.on('connect', function() {
		WS.emit('init', {
		    master: P.data.remote === false
		});
	    });

	    WS.on('room:nowplaying', function(data) {
		if (data.room !== P.data.room || P.data.remote) return;

		if (data.vitamin) P.load(data.vitamin, true, data.position);
	    });

	    WS.on('room:users', function(data) {
		P.data.roomUsers = data;
		P.updateLive();
	    });

	    WS.on('init', function(data) {
		Log.debug(data);

		socketID = data.socket;

		P.data.users = data.users;
		P.data.room = data.room;
		P.updateLiveUsers();
		P.updateLive();
		// update room

		updateMaster(data.master, data.ua);
	    });

	    WS.on('sync', function(data) {
		Log.debug(data);

		P.data.room = data.room;
		P.updateLive();

		updateMaster(data.master, data.ua);
	    });

	    WS.on('users', function(users) {
		P.data.users = users;
		P.updateLiveUsers();
	    });

	    WS.on('player:volume', function(data) {
		vol.value = data.volume;
		P.updateVolume(true);
		return;
	    });

	    WS.on('player:play', function(data) {
		if (!P.data.remote) P.play(data.vitamin, data.mode);
	    });

	    WS.on('player:next', function() {
		if (!P.data.remote) P.next();
	    });

	    WS.on('player:previous', function() {
		if (!P.data.remote) P.previous();
	    });

	    WS.on('queue', function(data) {
		Queue.vitamins = data.queue;
		Queue.broadcast(true);
		Queue.render();
	    });

	    WS.on('player:history', function(data) {
		P.data.history = data;
		P.updateHistory(true);
	    });

	    WS.on('player:repeat', function(data) {
		P.data.repeat = data.repeat;
		P.updateRepeat();
	    });

	    WS.on('player:autoplay', function(data) {
		P.data.autoplay = data.autoplay;

		P.updateAutoplay();
	    });

	    WS.on('player:status', function(data) {
		if (P.data.remote) {

		    if (data.time) {
			P.data.time = data.time;
			P.updateTime();
		    }

		    if (data.position) {
			P.data.position = data.position;
			P.updatePosition();
		    }

		    if (data.loading) {
			P.data.loading = data.loading;
			P.updateLoading();
		    }

		    if (typeof data.playing !== 'undefined' && P.data.playing !== data.playing) {
			P.data.playing = data.playing;
			document.body.classList.toggle('playing', P.data.playing);
		    }
		}
	    });

	    WS.on('player:nowplaying', function(data) {
		P.data.mode = data.mode;
		P.data.nowplaying = data.nowplaying;
		P.updateNowplaying();
	    });

	    sm._writeDebug('player.init(): Ready', 1);
	}
	
    };

    return P;
});
