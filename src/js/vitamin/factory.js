/* global Elem, Utils, Player, Queue, App, Tags, doT, page, window, Multi, Modal, document, Me, Platform, Prescription, Request, View, localforage, Log, Offline */
(function (root, factory) {

    root.Vitamin = factory(root);

})(this, function () {

    'use strict';

    var tmpl = doT.template(View.tmpl('/vitamin/item.html'));
    var actionSheet = doT.template(View.tmpl('/vitamin/actionsheet.html'));

    return {
	render: function(data, opts) {
	    opts = opts || {};

	    var self = this;

	    var elem = Elem.create({
		className: 'vitamin i i-left i-right',
		attributes: {
		    'data-id': data.id
		}
	    });

	    data.artwork = this.getArtwork(data);
	    data.time = data.duration ? Utils.duration(data.duration) : '';
	    data.crated = data.craters ? Utils.exists(data.craters, Me.username, 'username') : false;
	    data.queued = Queue.isQueued(data.id);
	    data.bitrate = data.hosts[0].bitrate ? data.hosts[0].bitrate + 'kbps' : '';

	    if (data.verified_at) {
		data.displayTitle = data.title;
	    } else {
		for (var i=0; i<data.hosts.length; i++) {
		    if (data.hosts[i].vitamin_title) {
			data.displayTitle = data.hosts[i].vitamin_title;
			break;
		    }
		}

		if (!data.displayTitle) data.displayTitle = data.title;
	    }

	    elem.innerHTML = tmpl(data);

	    var actions = elem.querySelector('.right');

	    elem.querySelector('.play').onclick = function() { Player.play(data); };
	    elem.querySelector('.crate').onclick = function() { self.toggleCrate(data); };
	    elem.querySelector('.queue').onclick = function() { Queue.toggle(data); };
	    elem.querySelector('.i-body').onclick = function(e) {
		if (window.innerWidth < 767) {
		    e.preventDefault();
		    e.stopPropagation();
		    self.more(e, data);
		    return false;
		} else if (!e.target.classList.contains('i-title')) {
		    Multi.toggle(data);
		}
	    };

	    elem.querySelector('.more').onclick = function(e) { self.more(e, data); };

	    elem.classList.toggle('nowplaying', Player.isPlaying(data.id));

	    if (data.crated) {
		elem.appendChild(Tags.render());

		var parent = elem.querySelector('.tags .current');
		if (data.tags.length) {
		    data.tags.forEach(function(t) {
			parent.appendChild(Tags.tag(t.value, { create: true }));
		    });
		}
	    }

	    if (opts.editable) {
		Elem.create({
		    tag: 'button',
		    className: 'icon failure delete',
		    parent: actions,
		    attributes: { title: 'remove'},
		    onclick: Prescription.removeVitamin
		});
	    }

	    var multi = Elem.create({
		tag: 'button',
		className: 'i-select checkbox',
		parent: actions,
		onclick: function() {
		    Multi.toggle(data);
		}
	    });

	    if (opts.drag) {
		Elem.create({
		    className: 'i-handle',
		    parent: actions
		});
	    }

	    if (Platform.isNative() && data.crated) {
		localforage.getItem(data.id.toString()).then(function(v) {
		    var icon = Elem.create({tag: 'i', className: 'icon-download'});
		    if (v.offline) elem.querySelector('.i-description').appendChild(icon);
		    if (v.filename) icon.classList.add('success');
		});
	    }

	    return elem;
	},

	more: function(e, data) {

	    var self = this;

	    var contextmenu = window.innerWidth >= 767;

	    var elem = Elem.create();

	    var o = {
		id: data.id,
		offlineMode: Platform.isNative(),
		crated: data.crated,
		queued: Queue.isQueued(data.id),
		playing: Player.data.playing && Player.isPlaying(data.id)
	    };

	    elem.innerHTML = actionSheet(o);

	    elem.querySelector('.play').onclick = function(e) {
		Modal.close(e);
		Player.play(data);
	    };

	    elem.querySelector('.crate').onclick = function(e) {
		Modal.close(e);
		self.toggleCrate(data);
	    };

	    elem.querySelector('.queue').onclick = function(e) {
		Modal.close(e);
		Queue.toggle(data);
	    };

	    elem.querySelector('.show-drafts').onclick = function(e) {
		Modal.close(e);
		Prescription.showDrafts(data.id);
	    };

	    elem.querySelector('.edit-title').onclick = function(e) {
		Modal.close(e);
		Vitamin.showEdit(data);
	    };

	    if (o.offlineMode && o.crated) {
		var offline = elem.querySelector('.offline');
		offline.onclick = function(e) {
		    Modal.close(e);
		    Offline.toggle(data);
		};

		localforage.getItem(data.id.toString()).then(function(v) {
		    offline.innerHTML = '<i class="icon-download"></i><span>' + (v.offline ? 'remove' : 'save') + ' offline </span>';
		});
	    }

	    var getStyle, bottom, modal_height = 290;
	    if (contextmenu) {
		bottom = (e.y + modal_height) > window.innerHeight;
		getStyle = function() {
		    var style = {
			right: (window.innerWidth - e.x) + 'px'
		    };

		    if (bottom) {
			style.top = (e.y - modal_height) + 'px';
		    } else {
			style.top = e.y + 'px';
		    }
		    return style;
		};
	    }

	    var opts = {
		elem: elem,
		className: contextmenu ? (bottom ? 'context-menu bottom ' : 'context-menu') : 'action-sheet',
		style: contextmenu ? getStyle() : {},
		header: data.displayTitle
	    };

	    Modal.show(opts);
	},

	browse: function(params, cb) {
	    App.api('/vitamins').get(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	create: function(params, cb) {
	    App.api('/vitamin').post(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	read: function(id, subpath, params, cb) {
	    var url = '/vitamin/' + id;
	    if (subpath) url += '/' + subpath;
	    App.api(url).get(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	update: function(id, title, original) {
	    App.api('/vitamin/' + id).put({
		title: title
	    }).success(function() {
		var elems = document.querySelectorAll('.vitamin[data-id="' + id + '"] .i-title');
		Elem.each(elems, function(ele) {
		    ele.innerHTML = title;
		});
	    }).error(function(err) {
		Log.error(err, title);
	    });
	},

	findOrCreate: function(data, cb) {
	    if (!data.id) {
		this.create({
		    title: data.title,
		    duration: data.duration,
		    host: data.hosts[0].title,
		    id: data.hosts[0].identifier,
		    url: data.hosts[0].url,
		    stream_url: data.hosts[0].stream_url
		}, cb);
	    } else {
		cb(null, data);
	    }
	},

	toggleCrate: function(data) {
	    var divs = document.querySelectorAll('.vitamin[data-id="' + data.id  + '"] .crate');
	    var crated = data.crated;

	    Elem.each(divs, function(div) {
		div.dataset.active = !crated;

		var p = Elem.getClosest(div, '.vitamin');

		if (!crated) {
		    p.appendChild(Tags.render());
		} else {
		    p.removeChild(p.querySelector('.tags'));
		}
	    });

	    var np = Player.data.nowplaying;
	    if (np.id === data.id) {
		if (!crated) {
		    np.craters.push({
			username: Me.username
		    });
		} else {
		    var idx = Utils.find(np.craters, Me.username, 'username');
		    Player.data.nowplaying.craters.splice(idx, 1);
		}
		Player.broadcast.nowplaying();
	    }

	    if (Queue.isQueued(data.id)) {
		var qv = Queue.vitamins[Utils.find(Queue.vitamins, data.id)];
		if (!crated) {
		    qv.craters.push({
			username: Me.username
		    });
		} else {
		    var idx2 = Utils.find(qv.craters, Me.username, 'username');
		    qv.craters.splice(idx2, 1);
		}
		Queue.broadcast();
	    }

	    var cb = function(err) {
		if (err) {
		    data.crated = crated;

		    Elem.each(divs, function(div) {
			div.dataset.active = crated;

			var p = Elem.getClosest(div, '.vitamin');

			if (crated) {
			    p.appendChild(Tags.render());
			} else {
			    p.removeChild(p.querySelector('.tags'));
			}
		    });
		}
	    };

	    data.crated = !data.crated;

	    if (crated) this.uncrate(data, cb);
	    else this.crate(data, cb);
	},

	crate: function(data, cb) {
	    if (Platform.isNative()) {
		localforage.setItem(data.id.toString(), {
		    id: data.id,
		    title: data.title,
		    duration: data.duration,
		    processed_at: data.processed_at,
		    processing_failed_at: data.processing_failed_at
		}, function(err) {
		    if (err) Log.error(err);
		});
	    }

	    App.api('/vitamin/' + data.id + '/crate').post().success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	uncrate: function(data, cb) {
	    if (Platform.isNative()) {
		localforage.removeItem(data.id.toString(), function(err) {
		    if (err) Log.error(err);
		});
	    }

	    App.api('/vitamin/' + data.id + '/crate').del().success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res.data, null);
	    });
	},

	getEchonestTracks: function(id, cb) {
	    var enUrl = 'https://developer.echonest.com/api/v4/song/profile?' + [
		'id=' + id,
		'api_key=YNYFKJ25QRGXMD3XZ'
	    ].join('&');

	    Request.get(enUrl).success(function(data) {
		cb(null, data.response.songs);
	    }).error(function(err, res) {
		cb('echonest api error', res);
	    });
	},

	showEdit: function(data) {
	    console.log(data);

	    var elem = Elem.create();
	    var form = Elem.create({
		tag: 'form',
		className: 'i',
		parent: elem,
		childs: [{
		    tag: 'label',
		    text: 'artist - title (remix)'
		}, {
		    tag: 'input',
		    className: 'pill',
		    attributes: {
			type: 'text',
			value: data.displayTitle
		    }
		}, {
		    tag: 'small',
		    text: 'Note: No quotations, brackets, album/release information. Only variation info should be in paranthesis (i.e. remix, cover, live).'
		}]
	    });
	    var h = Elem.create({
		className: 'h _d',
		parent: elem,
		childs: [{
		    tag: 'a',
		    text: 'Related'
		}]
	    });
	    var list = Elem.create({
		className: 'list',
		parent: elem
	    });

	    form.onsubmit = function(e) {
		var newTitle = e.target.querySelector('input').value;
		Modal.close(e);
		Vitamin.update(data.id, newTitle, data.displayTitle);
		return false;
	    };

	    data.hosts.forEach(function(h) {
		Elem.create({
		    className: 'i',
		    text: h.vitamin_title,
		    parent: list
		});
	    });

	    if (data.echonest_id) {
		this.getEchonestTracks(data.echonest_id, function(err, res) {
		    if (err) Log.error(err, data);
		    res.forEach(function(h) {
			Elem.create({
			    className: 'i',
			    text: h.artist_name + ' - ' + h.title,
			    parent: list
			});
		    });
		});
	    }

	    Modal.show({
		elem: elem,
		header: 'Edit Title',
		close: true
	    });
	},

	getArtwork: function(data) {
	    var artwork = '';
	    for (var a=0; a<data.hosts.length; a++) {
		if (data.hosts[a].artwork_url) {
		    artwork = data.hosts[a].artwork_url.indexOf('.sndcdn.com') === -1 ?
			data.hosts[a].artwork_url :
			data.hosts[a].artwork_url.replace('-large', '-t500x500');
		    break;
		}
	    }
	    return artwork;
	}
    };
});
