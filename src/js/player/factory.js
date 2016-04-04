/* global soundManager, youtubeManager, document, Queue, WS, Vitamin, Elem, window, Platform, Log, cordova, Network, App, User, Me, CONFIG, Image, localforage, UAParser, Notification, Auth, View */
(function(root, factory) {

    root.Player = factory(root);

})(this, function() {

    'use strict';

    var sm = soundManager,
	ym = youtubeManager,
	sb = document.getElementById('statusbar'),
	vol = document.querySelector('#volume input'),
	waveform = document.getElementById('waveform'),
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
	    playInit: false,
	    autoplay: false,
	    remote: null,
	    repeat: false,
	    mode: null,
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
	    this.data.users = [];

	    this.data.mode = null;

	    //this.updateLiveUsers();
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

	updateTime: function(position, total) {
	    P.data.time = {
		position: position,
		total: total
	    };
	    document.getElementById('current-time').innerHTML = P.getTime(position, true);
	    document.getElementById('remaining-time').innerHTML = '-' + P.getTime(total - position, true);
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
	    Vitamin.readOffline(P.data.nowplaying, function(err, vitamin) {
		if (err) {
		    Log.error(err);
		    return;
		}
		var l = document.querySelector('#nowplaying .list');
		l.innerHTML = null;
		l.appendChild(Vitamin.render(vitamin));
	    });
	    waveform.style['background-image'] = 'url(https://s3.amazonaws.com/vacay/' + CONFIG.env + '/waveforms/' + P.data.nowplaying.id + '.png)';
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

		if (P.lastSound)
		    P.lastSound.setVolume(volume);
	    }

	    document.querySelector('.vol-val').style.width  = P.data.volume + '%';

	    if (!localOnly) {
		WS.emit('player:volume', {
		    volume: volume
		});
	    }
	},

	updateHistory: function(localOnly) {
	    Vitamin.readOffline(P.data.history[P.data.history.length - 1], function(err, vitamin) {
		if (err) {
		    Log.error(err);
		    return;
		}
		var elem = document.querySelector('#previous .list');
		elem.innerHTML = null;
		elem.appendChild(Vitamin.render(vitamin));
	    });

	    if (!localOnly) {
		WS.emit('player:history', P.data.history);
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

	updatePlaying: function(value) {
	    P.data.playing = value;
	    if (window.MusicControls) window.MusicControls.updateIsPlaying(value);
	    document.body.classList.toggle('playing', value);
	},

	updatePosition: function(value) {
	    P.data.position = value;
	    sb.querySelector('.position').style.width = value;
	},

	updateLoading: function(value) {
	    P.data.loading = value;
	    sb.querySelector('.loading').style.width = value;
	},

	updateAutoplay: function() {
	    document.querySelector('#autoplay .btn-switch').classList.toggle('active', P.data.autoplay);
	},

	updateRepeat: function() {
	    document.querySelector('.p-ctrls .repeat').classList.toggle('active', P.data.repeat);
	},
	
	events: {
	    play: function () {
		P.updatePlaying(true);
		P.setPageTitle('\u25B6');
		P.broadcast.status();
	    },
	    stop: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;

		P.updatePlaying(false);
		P.updatePosition('0%');
		P.setPageTitle();
		P.broadcast.status();
	    },
	    pause: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;

		if (P.dragActive) return;

		P.updatePlaying(false);
		P.setPageTitle('\u25FC');
		P.broadcast.status();
	    },
	    resume: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;

		if (P.dragActive) return;

		P.updatePlaying(true);
		P.setPageTitle('\u25B6');
		P.broadcast.status();
	    },
	    finish: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;

		P.updatePlaying(false);
		P.setPageTitle();

		if (!Room.name()) P.data.repeat ? P.repeat() : P.next();
		else if (Room.isMaster()) P.next();
	    },
	    whileloading: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;

		var self = this;
		function doWork() {
		    if (P.data.nowplaying.id === self._data.vitamin.id) {
			P.updateLoading(((self.bytesLoaded / self.bytesTotal) * 100) + '%');
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
		    Log.error('load error', {
			vitamin: this._data.vitamin
		    });

		    Notification.show({
			msg: 'Temporarily failed to load stream.',
			action: {
			    onclick: function() {},
			    text: 'Ok'
			}
		    });
		}
	    },
	    whileplaying: function () {
		if (this._data.vitamin.id !== P.data.nowplaying.id) return;
		P.data.playInit = true;

		var i, d = null;

		if (P.dragActive) {

		    P.updatePosition(((this.position / this.durationEstimate) * 100) + '%');
		    P.updateTime(this.position, this.durationEstimate);

		} else {

		    d = new Date();

		    if (d - P.lastWPExec > 30) {

			if (window.cordova) {
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

			    var completed = function(e) {
				Log.debug(e);
			    };

			    var failed = function(e) {
				Log.error(e);
			    };

			    if (Platform.isIOS() && window.remoteControls) {
				var params = [artist, title, album, image, duration, elapsedTime];
				window.cordova.exec(completed, failed, 'RemoteControls', 'updateMetas', params);
			    }

			    if (Platform.isAndroid() && window.MusicControls) {
				window.MusicControls.create({
				    track: title,
				    artist: artist,
				    cover: image,
				    isPlaying: true,
				    dismissable: true,
				    ticker: 'Now playing "' +  title + '"'
				}, completed, failed);
			    }
			}

			var progress = this.position / this.durationEstimate;

			P.updatePosition((progress * 100) + '%');
			P.updateTime(this.position, this.durationEstimate);
			P.broadcast.status();

			P.lastWPExec = d;
		    }
		}
	    }
	},

	play: function (vitamin, mode) {
	    if (P.data.remote) {
		WS.emit('player:play', { vitamin: vitamin, mode: mode });
		return;
	    }

	    //TODO - alert user
	    if (!Room.canControl()) Room.leave();

	    P.data.mode = mode;

	    if (mode) {
		P.loadMode();
		return;
	    }

	    if (vitamin instanceof Array) {
		var vitamins = JSON.parse(JSON.stringify(vitamin));
		var first = vitamins.shift();
		Queue.addNext(vitamins);
		P.load(first);
	    } else if (vitamin || P.data.nowplaying) {
		P.load(vitamin || P.data.nowplaying);
	    } else if (Queue.vitamins[0]) {
		P.load(Queue.getNext());
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
	    P.load(P.data.nowplaying);
	},

	next: function () {
	    if (P.data.remote) {
		WS.emit('player:next');
		return;
	    }

	    //TODO - alert user
	    if (!Room.canControl()) Room.leave();

	    if (Queue.vitamins[0]) {
		P.load(Queue.getNext());
	    } else if (P.data.mode) {
		P.loadMode();
	    } else if (P.data.autoplay) { //TODO - not during Room.data.name
		var username = Me.username;
		User.read(username, 'crate', {
		    limit: 1,
		    order_by: 'rand'
		}, function(err, vitamins) {
		    if (err) Log.error(err);
		    if (vitamins.length) {
			P.load(vitamins[0]);
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

	    //TODO - alert user
	    if (!Room.canControl()) Room.leave();

	    if (P.lastSound.position > 3000) {
		if (Room.name())
		    P.broadcast.position(0);

		P.lastSound.setPosition(0);
		P.lastSound.resume();
	    } else if (P.data.history.length) {
		//TODO - use persisted history

		Queue.addNext(P.data.nowplaying);
		P.load(P.data.history.pop(), { noHistory: true });
		P.updateHistory();
	    }
	},

	loadMode: function() {
	    App.api(P.data.mode.path).get(P.data.mode.params).success(function(res) {
		if (P.data.mode.params.offset) P.data.mode.params.offset++;
		if (res.data.length) P.load(res.data[0]);
	    }).error(function(res) {
		P.data.mode = null;
		var header = document.querySelector('#nowplaying .p-header');
		header.innerHTML = 'now playing';
		Log.error(res);
	    });
	},

	load: function(vitamin, opts) {
	    var soundURL, thisSound;

	    opts = opts || {};

	    if (P.lastSound && P.lastSound._data.vitamin.id === vitamin.id) {
		if (opts.position) P.lastSound.setPosition(opts.position);

		// ..and was playing (or paused) and isn't in an error state
		if (P.lastSound.readyState !== 2) {
		    if (P.lastSound.playState !== 1) P.lastSound.play(); // not yet playing
		    else P.lastSound.togglePause();
		} else {
		    sm._writeDebug('Warning: sound failed to load (security restrictions, 404 or bad format)', 2);
		}

	    } else {

		if (P.lastSound) {

		    P.lastSound.stop();

		    if (!opts.noHistory) {
			P.data.history.push(P.lastSound._data.vitamin);
			P.updateHistory();
		    }
		}

		P.data.nowplaying = vitamin;
		P.updateNowplaying();

		P.getStream(vitamin, function(err, url) {

		    if (err) {
			Log.error(err, { vitamin: vitamin });
			Notification.show({
			    msg: 'Stream currently unavailable.',
			    action: {
				onclick: function() {},
				text: 'Ok'
			    }
			});
			//TODO - update vitamin data
			//TODO - update UI
			return;
		    }

		    // Prevent double loading
		    if (P.data.nowplaying.id !== vitamin.id) return;

		    Log.info('Loading: ', url);
		    soundURL = url;

		    if (soundURL.indexOf('youtube.com') !== -1) {
			thisSound = P.createYTSound(soundURL);
			P.updateArtwork(true);
		    } else {
			thisSound = P.createSMSound(soundURL);
		    }

		    thisSound._data = { vitamin: vitamin };

		    P.lastSound = thisSound;

		    thisSound.play();
		    if (opts.position) thisSound.setPosition(opts.position);

		    // analytics.track('play');
		    // record play count & history

		    if (Network.online && !opts.noBroadcast)
			P.broadcast.nowplaying();

		});
	    }
	},

	getFile: function(vitamin, cb) {
	    if (Platform.isNative()) localforage.getItem(vitamin.id.toString()).then(cb);
	    else cb();
	},

	getStream: function(vitamin, cb) {
	    P.getFile(vitamin, function(f) {
		if (f && f.filename) {
		    cb(null, Downloader.offlinePath + f.filename);
		} else {
		    Vitamin.getStream(vitamin.id, cb);
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
	    if (Platform.isTouchDevice() && e.touches) {
		e = e.touches[0];
	    }

	    var o = Elem.getTheDamnTarget(e);
	    if (!o) return true;

	    if (!Elem.isChildOfClass(o, 'statusbar-container')) return true;

	    if (!(P.lastSound || P.data.remote)) return true;

	    P.dragActive = true;
	    if (!P.data.remote) P.lastSound.pause();
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
		if (!P.data.remote) {
		    if (P.data.playing) {
			P.lastSound.resume();
		    } else {
			P.updatePosition(((P.lastSound.position / P.lastSound.durationEstimate) * 100) + '%');
			P.broadcast.status();
		    }
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
		x, oSb, oSound, nMsecOffset, duration;
	    if (!oThis) {
		return;
	    }
	    oSb = oThis;
	    while (!oSb.classList.contains('statusbar-container') && oSb.parentNode) {
		oSb = oSb.parentNode;
	    }
	    duration = P.data.remote ? P.data.time.total : P.lastSound.durationEstimate;
	    x = parseInt(e.clientX, 10);
	    nMsecOffset = Math.floor((x - Elem.getOffX(oSb) - 4) / (oSb.offsetWidth) * duration);
	    if (!isNaN(nMsecOffset)) {
		nMsecOffset = Math.min(nMsecOffset, duration);
	    }
	    if (!isNaN(nMsecOffset)) {

		if (P.data.remote || Room.name())
		    P.broadcast.position(nMsecOffset);

		if (!P.data.remote) {
		    oSound = P.lastSound;
		    oSound.setPosition(nMsecOffset);
		}
	    }
	},
	
	isPlaying: function(id) {
	    return (this.data.nowplaying && this.data.nowplaying.id === id) ? true: false;
	},

	setMaster: function() {
	    WS.emit('set:master');
	},

	broadcast: {
	    nowplaying: function() {
		WS.emit('player:nowplaying', {
		    nowplaying: Vitamin.getData(P.data.nowplaying),
		    user: Me.getData(),
		    room: Room.name(),
		    mode: P.data.mode
		});
	    },
	    status: function() {
		WS.emit('player:status', {
		    time: P.data.time,
		    playing: P.data.playing,
		    position: P.data.position,
		    loading: P.data.loading,
		    id: P.data.nowplaying.id,
		    room: Room.name()
		});
	    },
	    position: function(p) {
		WS.emit('player:position', { position: p, room: Room.name() });
	    }
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

	    if (window.MusicControls) {
		var androidEvents = function(action) {
		    switch(action) {
		    case 'music-controls-next':
			P.next();
			break;
		    case 'music-controls-previous':
			P.prev();
			break;
		    case 'music-controls-pause':
			P.lastSound && P.lastSound.togglePause();
			break;
		    case 'music-controls-play':
			P.lastSound && P.lastSound.togglePause();
			break;
		    default:
			break;
		    }
		};

		window.MusicControls.subscribe(androidEvents);
		window.MusicControls.listen();

	    }

	    vol.value = P.data.volume;
	    vol.addEventListener('change', function() {
		P.updateVolume();
	    });

	    var socketID = null;

	    var updateMaster = function(master, ua) {

		var isMaster = socketID === master;

		if (isMaster && P.data.remote && P.data.playing)
		    P.updatePlaying(false);
		else if (!isMaster && !P.data.remote  && P.data.playing)
		    P.stop();

		var parser = new UAParser();
		parser.setUA(ua);
		var result = parser.getResult();

		if (result.ua)
		    document.querySelector('.rc small').innerHTML = 'playing on ' + result.os.name + ' - ' + result.browser.name;

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

	    WS.on('init', function(data) {
		Log.debug(data);

		socketID = data.socket;

		Room.data = data.room;
		Room.update();

		updateMaster(data.master, data.ua);
	    });

	    WS.on('sync', function(data) {
		Log.debug(data);

		Room.data = data.room;
		Room.update();

		updateMaster(data.master, data.ua);
	    });

	    WS.on('player:position', function(data) {
		if (P.lastSound && (!P.data.remote || (data.room && data.room === Room.name())))
		    P.lastSound.setPosition(data.position);
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

	    WS.on('room', function(data) {
		Room.data = data;
		Room.update();
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

		    if (data.time) P.updateTime(data.time.position, data.time.total);

		    if (data.position) P.updatePosition(data.position);

		    if (data.loading) P.updateLoading(data.loading);

		    if (typeof data.playing !== 'undefined' && P.data.playing !== data.playing) P.updatePlaying(data.playing);
		} else if (Room.name() && P.data.playing !== data.playing) {
		    if (P.lastSound)
			data.playing ? P.lastSound.resume() : P.lastSound.pause();
		    P.updatePlaying(data.playing);
		}
	    });

	    WS.on('player:nowplaying', function(data) {
		Log.info('player:nowplaying', data);
		P.data.mode = data.mode;

		if (data.nowplaying) {
		    P.data.nowplaying = data.nowplaying;
		    P.updateNowplaying();

		    if (!data.room || data.room !== Room.name() || P.data.remote)
			return;

		    if (data.nowplaying) P.load(data.nowplaying, {
			position: data.position,
			noBroadcast: true
		    });
		}
	    });

	    sm._writeDebug('player.init(): Ready', 1);
	}
	
    };

    return P;
});
