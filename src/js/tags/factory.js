/* global */
(function(root, factory) {

  root.Tags = factory(root);

})(this, function() {

  'use strict';

  return {
    render: function(data) {
      var self = this;
      var container = Elem.create({ className: 'tags i-body' });
      var current = Elem.create({
	tag: 'span',
	className: 'current'
      });

      if (data.length) {
	data.forEach(function(t) {
	  current.appendChild(Tag.render(t.value, { link: true, remove: true, username: Me.username }));
	});
      }	    

      current.onclick = function(e) {
	if (e.target.classList.contains('remove')) {
	  var id = Elem.getClosest(e.target, '[data-id]').dataset.id;
	  var value = Elem.getClosest(e.target, '.tag').dataset.value;

	  Tag.destroy(id, { value: value }, function(err) {
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
	Tag.create(id, {value: value}, function(err) {
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

	if (!/^[@A-Za-z0-9\-_.+!*'&][A-Za-z0-9\s\-_.+!*'&\/]*$/.test(s)) {
	  Notification.show({msg: 'Tag includes an invalid character'});
	  return;
	}

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
	  frag.appendChild(Tag.render(s));
	}

	ts.forEach(function(t) {
	  frag.appendChild(Tag.render(t.value));
	});

	e.target.nextElementSibling.appendChild(frag);
      });
      container.appendChild(current);
      container.appendChild(input);
      container.appendChild(results);

      return container;
    }
  };
});

