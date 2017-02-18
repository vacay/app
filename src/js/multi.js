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
      document.querySelector('#multi .selected').innerHTML = cnt;

      var ps = document.querySelectorAll('.prescription');
      Elem.each(ps, function(p) {
	var ids = [];
	var vs = p.querySelectorAll('.vitamin');
	Elem.each(vs, function(v) {
	  ids.push(parseInt(v.dataset.id, 10));
	});

	if (!ids.length) return;

	var state = Utils.exists(self.vitamins, ids[0]);
	var ch = p.querySelector('.checkbox');

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

      if (cnt) {
	var allCrated = this.vitamins[0].crated && !this.crateIndeterminate();
	document.querySelector('#multi .crate').dataset.active = allCrated;

	var allQueued = Queue.isQueued(this.vitamins[0].id) && !this.queueIndeterminate();
	document.querySelector('#multi .queue').dataset.active = allQueued;
      }
    },

    render: function(data) {
      var elem = Elem.create({
	tag: 'button',
	className: 'i-select checkbox'
      });

      if (data instanceof Array) {
	var vitamin_ids = [];
	for (var i=0; i<data.length; i++) {
	  vitamin_ids.push(data[i].id);
	}

	elem.onclick = function() {
	  var state = Utils.exists(Multi.vitamins, vitamin_ids[0]);
	  if (!state || Multi.indeterminate(state, vitamin_ids))
	    Multi.add(data);
	  else
	    Multi.remove(data);
	};
      } else {
	elem.onclick = function() {
	  Multi.toggle(data);
	};
      }

      return elem;
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
      var queued = Queue.isQueued(this.vitamins[0].id) && !this.queueIndeterminate();
      if (queued) Queue.remove(this.vitamins);
      else Queue.add(this.vitamins);
      this.clear();
    },

    queueIndeterminate: function() {
      if (!this.vitamins.length) return false;

      var state = Queue.isQueued(this.vitamins[0].id);

      for (var i=1; i<this.vitamins.length; i++) {
	if (state !== Queue.isQueued(this.vitamins[i].id)) return true;
      }

      return false;
    },

    crate: function() {
      var crated = this.vitamins[0].crated && !this.crateIndeterminate();
      var vitamins = this.vitamins.filter(function(v) {
	return v.crated === crated;
      });

      var selectors = [];
      vitamins.forEach(function(v) {
	selectors.push('.vitamin[data-id="' + v.id  + '"] .crate');
      });
      var divs = document.querySelectorAll(selectors);

      var cb = function(err) {
	if (err) {
	  vitamins.forEach(function(v) {
	    v.crated = crated;
	  });

	  Elem.each(divs, function(div) {
	    div.dataset.active = crated;
	  });
	}
      };

      Elem.each(divs, function(div) {
	div.dataset.active = !crated;
      });

      vitamins.forEach(function(v) {
	v.crated = !crated;
      });

      if (crated) {
	Vitamin.uncrateAll(vitamins, cb);
      } else {
	Vitamin.crateAll(vitamins, cb);
      }
      this.clear();
    },

    crateIndeterminate: function() {
      if (!this.vitamins.length) return false;

      var state = this.vitamins[0].crated;

      for (var i=1; i<this.vitamins.length; i++) {
	if (state !== this.vitamins[i].crated) return true;
      }

      return false;
    },

    offline: function() {
      Offline.save(this.vitamins);
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
