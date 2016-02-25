/* global Elem, Utils, Me, App, Log, document */
(function(root, factory) {

    root.Tags = factory(root);

})(this, function() {

    'use strict';

    return {
	filter: function(opts) {
	    var container = Elem.create({ className: 'tags' });

	    var selected = Elem.create({ className: 'selected-tags' });
	    container.appendChild(selected);

	    var list = Elem.create({ className: 'tags' });
	    container.appendChild(list);

	    var tags = [];

	    User.read(opts.username, 'tags', {}, function(err, data) {
		if (err) Log.error(err);

		data.forEach(function(t, index) {
		    var a = Elem.create({
			tag: 'a',
			className: 'tag',
			text: t.value
		    });
		    a.onclick = function(e) {
			var active = e.target.classList.contains('active');

			a.remove();

			if (active) {
			    list.insertBefore(a, list.children[index]);
			    tags.splice(tags.indexOf(t.value), 1);
			    View.load({ tags: tags });
			} else {
			    selected.appendChild(a);
			    tags.push(t.value);
			    View.load({ tags: tags });
			}

			e.target.classList.toggle('active', !active);
		    };

		    if (opts.tag === t.value) {
			a.classList.toggle('active', true);
			tags.push(t.value);
			selected.appendChild(a);
		    } else {
			list.appendChild(a);
		    }
		});
	    });

	    return container;
	},

	render: function() {
	    var self = this;
	    var tag = Elem.create({ className: 'tags' });
	    var tags = Elem.create({
		tag: 'span',
		className: 'current'
	    });

	    tags.onclick = function(e) {
		if (e.target.classList.contains('remove')) {
		    var id = Elem.getClosest(e.target, '[data-id]').dataset.id;
		    var value = Elem.getClosest(e.target, '.tag').dataset.value;

		    self.destroy(id, { value: value }, function(err) {
			if (err) Log.error(err);
		    });
		}
	    };

	    var input = Elem.create({
		tag: 'input',
		className: 'input cursor',
		attributes: {
		    placeholder: '+Tag'
		}
	    });
	    var results = Elem.create({
		className: 'new'
	    });

	    var addTag = function(id, value) {
		self.create(id, {value: value}, function(err) {
		    if (err) Log.error(err);
		});

		input.value = results.innerHTML = null;
		input.focus();
	    };

	    results.onclick = function(e) {
		if (Elem.getClosest(e.target, '.tag')) {
		    var id = Elem.getClosest(e.target, '[data-id]').dataset.id;
		    var value = Elem.text(e.target);

		    addTag(id, value);
		}
	    };

	    input.addEventListener('keyup', function(e) {

		e.target.nextElementSibling.innerHTML = null;
		var s = e.target.value;

		if (!s) return;

		var keyCode = e.keyCode || e.which;
		if (keyCode == '13') {
		    var id = Elem.getClosest(e.target, '[data-id]').dataset.id;
		    addTag(id, s);
		    return;
		}

		var frag = document.createDocumentFragment();
		var ts = Me.tags.filter(function(t) {
		    return Utils.fuzzysearch(s.toLowerCase(), t.value.toLowerCase());
		});

		//TODO - make case insensitive
		if (!Utils.exists(Me.tags, s, 'value')) {
		    frag.appendChild(self.tag(s));
		}

		ts.forEach(function(t) {
		    frag.appendChild(self.tag(t.value));
		});

		e.target.nextElementSibling.appendChild(frag);
	    });
	    tag.appendChild(tags);
	    tag.appendChild(input);
	    tag.appendChild(results);

	    return tag;
	},

	tag: function(value, opts) {
	    opts = opts || {};

	    var elem = Elem.create({
		tag: 'span',
		className: 'tag'
	    });

	    var link = Elem.create({
		tag: 'a',
		text: value
	    });

	    elem.appendChild(link);

	    if (opts.create) {
		link.href = '/@' + Me.username + '/crate?tag=' + encodeURIComponent(value);

		var remove = Elem.create({
		    tag: 'a',
		    className: 'remove',
		    text: 'x'
		});

		elem.appendChild(remove);
	    }

	    elem.dataset.value = value;

	    return elem;
	},

	create: function(id, params, cb) {
	    //TODO - if native - update localforage
	    var self = this;
	    var divs = document.querySelectorAll('.vitamin[data-id="' + id + '"] .current');

	    Elem.each(divs, function(div) {
		div.appendChild(self.tag(params.value, { create: true }));
	    });

	    App.api('/vitamin/' + id + '/tag').post(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		var divs = document.querySelectorAll('.vitamin[data-id="' + id + '"] .tag[data-value="' + params.value + '"]');

		Elem.each(divs, function(div) {
		    div.parentNode.removeChild(div);
		});

		cb(res.data, null);
	    });
	},

	destroy: function(id, params, cb) {
	    //TODO - if native - update localforage
	    var self = this;
	    var divs = document.querySelectorAll('.vitamin[data-id="' + id + '"] .tag[data-value="' + params.value + '"]');

	    Elem.each(divs, function(div) {
		div.parentNode.removeChild(div);
	    });

	    App.api('/vitamin/' + id + '/tag').del(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		var divs = document.querySelectorAll('.vitamin[data-id="' + id + '"] .current');

		Elem.each(divs, function(div) {
		    div.appendChild(self.tag(params.value, { create: true }));
		});

		cb(res, null);
	    });
	}
    };
});
