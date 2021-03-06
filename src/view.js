/* global document, Loading, Elem, doT, Request, window */
(function(root, factory) {

  root.View = factory(root);

})(this, function() {

  'use strict';

  var m = document.getElementById('main');
  var title = document.getElementById('toolbar-title');
  var toolbar = document.getElementById('toolbar');

  if (!Platform.isMobile()) {
    toolbar.addEventListener('mouseenter', function(e) {
      if (window.innerWidth > 899) document.body.classList.toggle('menu-open', true);
    });

    toolbar.addEventListener('mouseleave', function(e) {
      if (window.innerWidth > 899) document.body.classList.toggle('menu-open', false);
    });

    window.addEventListener('resize', function() {
      View.updateToolbar();
    });
  }

  return {
    main: m,
    title: function(s) {
      title.innerHTML = s;
    },
    _onScroll: function() {
      var r = document.getElementById('river');
      if (r.dataset.loading) return;

      var scrollDistance = 2;
      var remaining = m.scrollHeight - m.scrollTop - m.offsetHeight;
      var shouldScroll = remaining <= (m.offsetHeight * scrollDistance);
      if (shouldScroll) {
	r.dataset.loading = true;
	this.load();
      }
    },
    tmpl: function(id) {
      return document.getElementById(id).innerHTML;
    },
    scrollOff: function() {
      m.removeEventListener('scroll', this._listener);
    },
    scrollOn: function() {
      this.scrollOff();
      this._listener = window.Throttle(this._onScroll.bind(this));
      m.addEventListener('scroll', this._listener);
    },
    render: function(opts) {
      opts = opts || {};
      var html = '';
      if (opts.id) html = this.tmpl(opts.id);
      if (opts.data) html = doT.template(html)(opts.data);
      if (opts.filter) html += this.tmpl('/filter/container.html');
      if (opts.title) this.title(opts.title);
      m.innerHTML = html;

      var river = Elem.create({
	className: opts.className || 'u u720',
	parent: m,
	attributes: {
	  id: 'river'
	}
      });
      river.dataset.loading = true;
      Elem.create({ className: 'list cf', parent: river });
      Elem.create({ className: 'md-loading-error', parent: river });
      river.appendChild(Loading.render({ indeterminate: true }));

      this.updateToolbar();

      if (opts.load) {
	this.scrollOn();
	this.load = opts.load;
	this.load();
      }
    },
    github: function(file, cb) {
      var url = 'https://api.github.com/repos/vacay/docs/contents/';
      var req = Request.get(url + file + '.md');
      req.success(function(res) {
	var content = window.atob(res.content);
	cb(null, content);
      }).error(function(res) {
	cb(res, null);
      });
    },
    trigger: function(type) {
      document.querySelector('.' + type + '-trigger').classList.toggle('active');
      document.body.classList.toggle(type + '-open');
      this.updateToolbar();
    },
    active: function(s) {
      document.querySelector(s).classList.add('active');
    },
    updateToolbar: function() {
      var r = document.getElementById('river');
      if (!r) return;
      var width = (m.offsetWidth - r.offsetWidth) / 2;
      document.getElementById('toolbar').style.width = width + 'px';
    },
    open: function(url) {
      if (Platform.isNodeWebkit()) {
	var gui = require('nw.gui');
	gui.Shell.openExternal(url);
      } else {
	window.open(url, Platform.isCordova() ? '_system' : '_blank');
      }
    }
  };

});
