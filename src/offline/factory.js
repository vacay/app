/* global Utils, localforage, User, Me, window, Log, Downloader, document, Elem */
(function(root, factory) {

  root.Offline = factory(root);

})(this, function() {

  'use strict';

  return {
    used: null,
    init: function() {
      var self = this;
      Downloader.getSpaceUsed(function(err, total) {
	if (err) Log.error(err);
	self.used = total;
	Log.info('space used: ', self.used);

	self.check();
      });
    },

    check: function() {
      var self = this;
      localforage.iterate(function(v, id, iterationNumber) {
	if (!v.filename) {
	  Downloader.save(v);
	  self.updateUI(v.id, true, false);
	}
      }, function(err) {
	if (err) {
	  Log.error(err);
	  return;
	}

	Log.info('Offline check complete');
      });
    },

    clear: function() {
      localforage.clear(function(err) {
	if (err) Log.error(err);
	Log.info('Offline Database cleared');
	Downloader.clear(function(err) {
	  if (err) Log.error(err);
	  Log.info('Files cleared');
	});
      });
      //TODO - Update UI
    },

    update: function(data) {
      var self = this;
      localforage.setItem(data.id.toString(), data, function(err, o) {
	self.updateUI(data.id, true, o.filename);
      });
    },

    save: function(data) {
      var self = this;

      var save = function(d) {
	localforage.setItem(d.id.toString(), d, function(err, o) {
	  if (err) Log.error(err);
	  Downloader.save(o);
	  self.updateUI(d.id, true, false);
	});
      };

      if (data instanceof Array) {
	data.forEach(save);
      } else {
	save(data);
      }
    },

    remove: function(data) {
      var self = this;
      localforage.removeItem(data.id.toString(), function(err) {
	if (err) Log.error(err);
	if (data.filename) Downloader.remove(data);
	self.updateUI(data.id, false, false);
      });
    },

    toggle: function(data) {
      var self = this;
      localforage.getItem(data.id.toString()).then(function(v) {
	if (v) self.remove(v);
	else self.save(data);
      });
    },

    updateProgress: function(id, progress) {
      var divs = document.querySelectorAll('.vitamin[data-id="' + id + '"] .statusbar .position');
      Elem.each(divs, function(div) {
	div.style.width = progress.toFixed() + '%';
      });
    },

    updateUI: function(id, offline, complete) {
      var divs = document.querySelectorAll('.vitamin[data-id="' + id + '"] .i-description');

      Elem.each(divs, function(div) {

	var progress = div.querySelector('.statusbar');
	var icon = div.querySelector('i');

	if (offline) {
	  if (!icon) {
	    Elem.create({tag: 'i', className: 'icon-download', parent: div });
	  }

	  if (complete) {
	    icon.classList.add('success');
	    div.removeChild(progress);
	  }

	  if (!progress) {
	    Elem.create({
	      className: 'statusbar',
	      parent: div,
	      childs: [{
		className: 'position'
	      }]
	    });
	  }

	} else {
	  div.removeChild(icon);
	}
      });
    }
  };
});
