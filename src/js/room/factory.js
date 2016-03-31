/* global */
(function(root, factory) {

    root.Room = factory(root);

})(this, function() {

    'use strict';

    return {
	data: null,

	render: function(data) {
	    var inRoom = data.name === this.name();

	    var i = Elem.create({
		className: 'i i-right room'
	    });

	    var body = Elem.create({
		className: 'i-body',
		parent: i
	    });

	    var a = Elem.create({
		tag: 'a',
		className: 'i-title',
		text: data.name,
		parent: body
	    });
	    a.href = '/room/' + data.name;

	    var btn = Elem.create({
		tag: 'button',
		className: 'rnd sm success right ' + (inRoom ? 'active' : ''),
		text: inRoom ? 'leave room' : 'join room',
		parent: i,
		onclick: function(e) {
		    if (inRoom) Room.leave();
		    else Room.join(data);

		    inRoom = !inRoom;
		    btn.classList.toggle('active', inRoom);		    
		}
	    });

	    return i;
	},

	update: function() {
	    var elem = document.querySelector('#proom .list');
	    elem.innerHTML = null;

	    if (this.data) elem.appendChild(this.render(this.data));
	},

	read: function(id, cb) {
	    App.api('/room/' + id).get().success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	create: function() {
	    var data = {
		listed: true,
		shared: true
	    };

	    var onswitch = function(e) {
		var s = Elem.getClosest(e.target, '.btn-switch');
		var value = !data[s.dataset.type];
		data[s.dataset.type] = value;
		s.classList.toggle('active', value);
	    };

	    var elem = Elem.create();

	    var input = Elem.create({
		tag: 'input',
		attributes: {
		    placeholder: 'enter a room name...'
		},
		parent: elem
	    });

	    input.style.padding = '25px 15px';
	    input.style.background = '#fafafa';

	    var listElem = Elem.create({
		className: 'i i-right',
		childs: [{
		    className: 'i-body',
		    childs: [{
			tag: 'h4',
			text: 'Room Visibility'
		    }, {
			tag: 'span',
			text: 'Set whether or not the room should be publicly listed'
		    }]
		}],
		parent: elem
	    });

	    Elem.create({
		className: 'btn-switch right active',
		childs: [{
		    tag: 'button',
		    className: 'sm on',
		    text: 'Listed'
		}, {
		    tag: 'button',
		    className: 'sm off',
		    text: 'Unlisted'
		}],
		dataset: { type: 'listed' },
		parent: listElem,
		onclick: onswitch
	    });

	    var sharedElem = Elem.create({
		className: 'i i-right',
		childs: [{
		    className: 'i-body',
		    childs: [{
			tag: 'h4',
			text: 'Room Control'
		    }, {
			tag: 'span',
			text: 'Set whether or not the room is controlled by only you or all members'

		    }]
		}],
		parent: elem
	    });

	    Elem.create({
		className: 'btn-switch right active',
		childs: [{
		    tag: 'button',
		    className: 'sm on',
		    text: 'Shared'
		}, {
		    tag: 'button',
		    className: 'sm off',
		    text: 'Single'
		}],
		dataset: { type: 'shared' },
		parent: sharedElem,
		onclick: onswitch
	    });

	    var btnElem = Elem.create({
		className: 'i',
		parent: elem
	    });

	    Elem.create({
		tag: 'button',
		className: 'sm rnd success pull-right',
		text: 'Join/Create',
		parent: btnElem
	    }).onclick = function(e) {
		if (!input.value) return;

		data.name = input.value;

		Room.join(data);
		Modal.close(e);
	    };

	    Modal.show({
		elem: elem,
		header: 'Join Room',
		close: true
	    });
	},

	join: function(data) {
	    Player.data.mode = null;

	    this.data = data;
	    this.update();

	    data.user = Me.getData();
	    WS.emit('room:join', data);
	},

	leave: function() {
	    this.data = null;
	    this.update();
	    WS.emit('room:leave');
	},

	canControl: function() {
	    return this.data && (this.data.shared || this.data.master === Me.username);
	},

	isMaster: function() {
	    return this.data && (this.data.master === Me.username);
	},

	name: function() {
	    return this.data && this.data.name;
	},

	reset: function() {
	    this.data = null;
	    this.update();
	}
    };
});
