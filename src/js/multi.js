/* global Elem, Utils, document, Player, Queue */
(function(root, factory) {

    root.Multi = factory(root);

})(this, function() {

    'use strict';

    return {
	vitamins: [],

	updateUI: function() {
	    var self = this;
	    var cnt = this.vitamins.length;
	    document.body.classList.toggle('show-multi', cnt);
	    document.querySelector('#multi .selected').innerHTML = cnt + ' selected';

	    var ps = document.querySelectorAll('.prescription');
	    Elem.each(ps, function(p) {
		var ids = [];
		var vs = p.querySelectorAll('.vitamin');
		Elem.each(vs, function(v) {
		    ids.push(parseInt(v.dataset.id, 10));
		});

		if (!ids.length) return;

		var state = Utils.exists(self.vitamins, ids[0]);

		var ch = p.querySelector('.i-actions .checkbox');

		if (self.indeterminate(state, ids)) {
		    ch.classList.add('indeterminate');
		    ch.classList.remove('selected');
		} else {
		    ch.classList.remove('indeterminate');		    
		    ch.classList.toggle('selected', state);
		}

	    });

	    var ds = document.querySelectorAll('.vitamin.selected');
	    Elem.each(ds, function(d) {
		d.classList.remove('selected');
		d.querySelector('.checkbox').classList.remove('selected');
	    });

	    for (var i=0; i < cnt; i++) {
		var ns = document.querySelectorAll('.vitamin[data-id="' + this.vitamins[i].id + '"]');
		Elem.each(ns, function(d) {
		    d.classList.add('selected');
		    d.querySelector('.checkbox').classList.add('selected');
		});
	    }
	},

	add: function(data) {
	    var self = this;
	    if (data instanceof Array) {
		data.forEach(function(d) {
		    if (!Utils.exists(self.vitamins, d.id)) self.vitamins.push(d);
		});
	    } else {
		if (!Utils.exists(this.vitamins, data.id)) this.vitamins.push(data);
	    }
	    this.updateUI();
	},

	remove: function(data) {
	    var self = this;
	    if (data instanceof Array) {
		data.forEach(function(d) {
		    var idx = Utils.find(self.vitamins, d.id);
		    if (idx !== -1) self.vitamins.splice(idx, 1);
		});
	    } else {
		var idx = Utils.find(this.vitamins, data.id);
		if (idx !== -1) this.vitamins.splice(idx, 1);
	    }
	    this.updateUI();
	},

	toggle: function(data) {
	    if (Utils.exists(this.vitamins, data.id)) {
		this.remove(data);
	    } else {
		this.add(data);
	    }
	},

	play: function() {
	    Player.play(this.vitamins);
	    this.clear();
	},

	queue: function() {
	    Queue.add(this.vitamins);
	    this.clear();
	},

	indeterminate: function(state, ids) {
	    for (var i=1; i<ids.length; i++) {
		if (state !== Utils.exists(this.vitamins, ids[i])) return true;
	    }

	    return false;
	},

	clear: function() {
	    this.vitamins.length = 0;
	    this.updateUI();
	}
    };
});
