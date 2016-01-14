/* global Elem, dragula, Elem, Platform, Vitamin, Queue, Utils, WS, document */
(function(root, factory) {

    root.Queue = factory(root);

})(this, function() {

    'use strict';

    return {
	vitamins: [],

	updateVitaminUI: function(id, state) {
	    var divs = document.querySelectorAll('.vitamin[data-id="' + id + '"] .queue');
	    Elem.each(divs, function(div) {
		div.dataset.active = state;
	    });
	},

	updateUI: function() {
	    document.querySelector('#p-icon .badge').innerHTML = this.vitamins.length;
	},

	resetUI: function() {
	    document.querySelector('#queue .list').innerHTML = null;

	    var divs = document.querySelectorAll('.vitamin .queue');
	    Elem.each(divs, function(div) {
		div.dataset.active = false;
	    });

	    this.updateUI();
	},

	render: function() {
	    var self = this;
	    var elem = document.querySelector('#queue .list');

	    self.resetUI();

	    if (!self.dragula) {
		self.dragula = dragula([elem], {
		    direction: 'vertical',
		    moves: function(el, container, handle) {
			if (!Elem.getClosest(el, '.vitamin'))
			    return false;

			if (Platform.isTouchDevice() && !handle.classList.contains('i-handle'))
			    return false;

			return true;
		    }
		});

		self.dragula.on('drop', function(el) {
		    var id = parseInt(el.dataset.id, 10);
		    var newIdx = [].indexOf.call(el.parentNode.children, el);
		    var prevIdx = Utils.find(Queue.vitamins, id);

		    var vitamin = Queue.vitamins.splice(prevIdx, 1)[0];
		    Queue.vitamins.splice(newIdx, 0, vitamin);

		    Queue.broadcast();
		});
	    }

	    var frag = document.createDocumentFragment();
	    this.vitamins.forEach(function(v) {
		frag.appendChild(Vitamin.render(v, { drag: true }));
		self.updateVitaminUI(v.id, true);
	    });

	    elem.appendChild(frag);
	},

	broadcast: function(localOnly) {

	    this.updateUI();

	    if (!localOnly) WS.emit('queue', { queue: this.vitamins });
	},
	
	getNext: function() {
	    var v = this.vitamins.shift();
	    this.broadcast();

	    var elem = document.querySelector('#queue .list [data-id="' + v.id + '"]');
	    elem.parentNode.removeChild(elem);

	    this.updateVitaminUI(v.id, false);

	    return v;
	},

	add: function(data) {
	    var self = this;
	    var elem = document.querySelector('#queue .list');

	    if (data instanceof Array) {
		data = data.filter(function(d) {
		    return !Utils.exists(self.vitamins, d.id);
		});
		this.vitamins = this.vitamins.concat(data);

		var frag = document.createDocumentFragment();
		data.forEach(function(v) {
		    frag.appendChild(Vitamin.render(v, { drag: true }));
		    self.updateVitaminUI(v.id, true);
		});

		elem.appendChild(frag);		

	    } else {
		this.vitamins.push(data);
		elem.appendChild(Vitamin.render(data, { drag: true }));
		this.updateVitaminUI(data.id, true);
	    }

	    this.broadcast();
	},

	addNext: function(data) {
	    var self = this;
	    var elem = document.querySelector('#queue .list');

	    if (data instanceof Array) {
		this.vitamins = data.concat(this.vitamins);

		var frag = document.createDocumentFragment();
		data.forEach(function(v) {
		    frag.appendChild(Vitamin.render(v, { drag: true }));
		    self.updateVitaminUI(v.id, true);
		});

		elem.insertBefore(frag, elem.firstChild);
		
	    } else {
		this.vitamins.unshift(data);
		this.updateVitaminUI(data.id, true);
		elem.insertBefore(Vitamin.render(data, { drag: true }), elem.firstChild);
	    }
	    this.broadcast();
	},

	remove: function(id) {
	    var i = Utils.find(this.vitamins, id);
	    if (i !== -1) {
		this.vitamins.splice(i, 1);
		var elem = document.querySelector('#queue .list [data-id="' + id + '"]');
		elem.parentNode.removeChild(elem);

		this.updateVitaminUI(id, false);

		this.broadcast();
	    }
	},

	toggle: function(data) {
	    var isQueued = this.isQueued(data.id);

	    if (isQueued) this.remove(data.id);
	    else this.add(data);
	},

	clear: function() {
	    this.reset();
	    this.broadcast();
	},

	reset: function() {
	    this.vitamins.length = 0;
	    this.resetUI();
	},

	isQueued: function(id) {
	    return Utils.exists(this.vitamins, id);
	}
    };

});
