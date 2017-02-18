/* global doT, App, Elem, Me, Utils, Prescription, Modal, User, document, Log, Vitamin, Multi, View, Notification, Upload, FileReader, Image, window, Loading, CONFIG */
(function(root, factory) {

  root.Prescription = factory(root);

})(this, function() {

  'use strict';

  var pDrafts = doT.template(View.tmpl('/prescription/drafts.html'));

  return {

    render: function(data, opts) {
      var self = this;
      opts = opts || {};

      var isOwner = data.prescriber.username === Me.username;

      var elem = Elem.create({
	className: 'c prescription' + (opts.single ? '' : ' simple'),
	attributes: {
	  'data-id': data.id
	}
      });

      var vitamins = Elem.create({ className: 'list' });

      if (data.image_url) {
	var image_url;
	if (data.image_url.indexOf('/tmp') === -1)
	  image_url = data.image_url.replace('-original', '-900');

	var img;
	if (opts.single) {
	  img = document.createElement('img');
	  img.src = image_url || data.image_url;		
	} else {
	  img = document.createElement('a');
	  img.style['background-image'] = 'url(' + (image_url || data.image_url) + ')';
	  img.href = '/prescription/' + data.id;
	}
	img.classList.add('i','i-image');

	elem.appendChild(img);
      }

      var prescriber = User.render(data.prescriber);
      elem.appendChild(prescriber);

      //TODO - markdown
      var description = Elem.create({
	className: 'i description',
	text: data.description,
	parent: elem
      });
      Elem.create({
	className: 'i description',
	parent: elem,
	childs: [{
	  tag: 'small',
	  text: Utils.fromNow(data.published_at)
	}]
      });

      var actions = Elem.create({ className: 'i p-actions' });

      //TODO - queue all
      Elem.create({
	tag: 'button',
	className: 'sm rnd',
	html: '<i class="icon-play"></i> Play',
	parent: actions
      }).onclick = function() {
	Player.play(data.vitamins);
      };

      if (!opts.single) {
	Elem.create({
	  tag: 'button',
	  className: 'sm rnd',
	  text: data.vitamins.length + ' Vitamin' + (data.vitamins.length > 1 ? 's' : ''),
	  parent: actions
	}).onclick = function() {
	  elem.classList.toggle('simple');
	  this.classList.toggle('active');
	};
      }

      var recommend = Elem.create({
	tag: 'button',
	className: 'sm rnd success recommend',
	text: '',
	parent: actions,
	childs: [{
	  tag: 'span',
	  className: 'active',
	  text: 'Recommended'
	}, {
	  tag: 'span',
	  className: 'inactive',
	  text: 'Recommend'
	}]
      });

      if (!isOwner && Me.id) {
	recommend.onclick = function(e) {
	  Prescription.toggleVote(e);
	};
	recommend.classList.toggle('active', Utils.exists(data.votes, Me.id, 'user_id'));
      } else {
	recommend.classList.add('disabled');
      }

      if (data.votes.length) {
	var count = Elem.create({
	  tag: 'button',
	  className: 'sm success link',
	  text: '+' + data.votes.length,
	  parent: actions
	});
      }

      actions.appendChild(Multi.render(data.vitamins));

      var owner_actions = Elem.create({ className: 'i o-actions' });

      if (isOwner) {
	var save = Elem.create({
	  tag: 'button',
	  className: 'sm link success save',
	  text: 'save',
	  parent: owner_actions
	});

	var edit = Elem.create({
	  tag: 'button',
	  className: 'sm link',
	  text: 'edit',
	  parent: owner_actions
	});

	save.onclick = function(e) {

	  var cb = function(err) {
	    if (err) Log.error(err);
	    //TODO
	  };

	  Prescription.update(data.id, {
	    description: Elem.text(description)
	  }, cb);

	  edit.innerHTML = 'edit';
	  description.contentEditable = 'false';

	  e.target.parentNode.classList.toggle('editable', false);
	};

	edit.onclick = function(e) {
	  var editable = !e.target.parentNode.classList.contains('editable');

	  if (editable) {
	    e.target.innerHTML = 'cancel';
	    description.contentEditable = 'true';
	    description.dataset.prev = Elem.text(description);
	  } else {
	    e.target.innerHTML = 'edit';
	    description.contentEditable = 'false';
	    description.innerHTML = description.dataset.prev;
	  }

	  e.target.parentNode.classList.toggle('editable', editable);
	};

	var setImage = Elem.create({
	  tag: 'button',
	  className: 'sm link',
	  text: 'set image',
	  parent: owner_actions
	}).onclick = function() {
	  self.setImage(data.id);
	};

	if (!data.published_at) {
	  var publish = Elem.create({
	    tag: 'button',
	    className: 'sm link success',
	    text: 'publish',
	    parent: owner_actions
	  });
	  publish.onclick = function() {
	    Modal.show({
	      confirm: {
		message: 'Are you sure you want to publish?',
		className: 'success',
		text: 'Publish',
		click: function(e) {
		  Prescription.update(data.id, {
		    published_at: new Date()
		  }, function(err) {
		    if (err) Log.error(err);
		  });
		  publish.parentNode.removeChild(publish);
		  Modal.close(e);
		}
	      }
	    });
	  };
	}

	var del = Elem.create({
	  tag: 'button',
	  className: 'sm link failure',
	  text: 'delete',
	  parent: owner_actions
	}).onclick = function() {
	  Modal.show({
	    confirm: {
	      message: 'Are you sure you want to delete?',
	      className: 'failure',
	      text: 'Delete',
	      click: function(e) {
		Prescription.destroy(data.id);
		Modal.close(e);
	      }
	    }
	  });
	};

	var drag = dragula([vitamins], {
	  direction: 'vertical',
	  moves: function(el, container, handle) {
	    if (!Elem.getClosest(el, '.vitamin'))
	      return false;

	    if (!handle.classList.contains('i-handle'))
	      return false;

	    return true;
	  }
	}).on('drop', function(el) {
	  var id = parseInt(el.dataset.id, 10);
	  var newIdx = [].indexOf.call(el.parentNode.children, el);
	  var prevIdx = Utils.find(data.vitamins, id);

	  var vitamin = data.vitamins.splice(prevIdx, 1)[0];
	  data.vitamins.splice(newIdx, 0, vitamin);

	  var vits = [];
	  for (var i=0; i<data.vitamins.length; i++) {
	    vits.push({
	      vitamin_id: data.vitamins[i].id,
	      order: i
	    });
	  }

	  Prescription.update(data.id, {
	    vitamins: vits
	  }, function(err) {
	    if (err) {
	      //TODO
	      Log.error(err);
	    }
	  });
	});
      }

      elem.appendChild(owner_actions);
      elem.appendChild(actions);

      data.vitamins.forEach(function(v) {
	//TODO - remove button
	vitamins.appendChild(Vitamin.render(v, {
	  remove: (isOwner && !data.published_at),
	  drag: isOwner
	}));
      });

      elem.appendChild(vitamins);

      return elem;
    },

    browse: function(params, cb) {
      App.api('/prescriptions').get(params).success(function(res) {
	cb(null, res.data);
      }).error(function(res) {
	cb(res, null);
      });
    },

    drafts: function(params, cb) {
      App.api('/me/drafts').get(params).success(function(res) {
	cb(null, res.data);
      }).error(function(res) {
	cb(res, null);
      });
    },

    read: function(id, cb) {
      App.api('/prescription/' + id).get().success(function(res) {
	cb(null, res.data);
      }).error(function(res) {
	cb(res, null);
      });
    },

    update: function(id, params, cb) {
      App.api('/prescription/' + id).put(params).success(function(res) {
	cb(null, res.data);
      }).error(function(res) {
	cb(res, null);
      });
    },

    destroy: function(id) {

      var divs = document.querySelectorAll('.prescription[data-id="' + id +'"]');

      Elem.each(divs, function(d) {
	d.parentNode.removeChild(d);
      });

      var cb = function(err) {
	if (err) {
	  Log.error(err);
	  //TODO
	}
      };

      App.api('/prescription/' + id).del().success(function(res) {
	cb(null, res.data);
      }).error(function(res) {
	cb(res, null);
      });
    },

    toggleVote: function(e) {
      var id = Elem.getClosest(e.target, '[data-id]').dataset.id;
      var hasVote = e.target.classList.contains('active');

      var divs = document.querySelectorAll('.prescription[data-id="' + id + '"] .recommend');

      Elem.each(divs, function(div) {
	div.classList.toggle('active', !hasVote);
      });

      var cb = function(err) {
	if (err) {
	  Elem.each(divs, function(div) {
	    div.classList.toggle('active', hasVote);
	  });
	}
      };

      if (hasVote) this.destroyVote(id, cb);
      else this.vote(id, cb);
    },

    vote: function(id, cb) {
      App.api('/prescription/' + id + '/vote').post().success(function(res) {
	cb(null, res.data);
      }).error(function(res) {
	cb(res, null);
      });
    },

    destroyVote: function(id, cb) {
      App.api('/prescription/' + id + '/vote').del().success(function(res) {
	cb(null, res.data);
      }).error(function(res) {
	cb(res, null);
      });
    },

    create: function(e) {

      var parent = Elem.getClosest(e.target, '[data-vitamin-id]');
      var p = parent.querySelector('input');

      var vitamin_id = parseInt(parent.dataset.vitaminId, 10);
      var description = p.value;

      if (description) {

	App.api('/prescription').post({
	  vitamins: [{
	    vitamin_id: vitamin_id,
	    order: 0
	  }],
	  description: description
	}).success(function(res) {
	  Notification.show({msg: 'Vitamin added to prescription' });
	}).error(function(res) {
	  //TODO
	  Log.error(res);
	});

      }

      Modal.close(e);

    },

    addVitamin: function(prescription_id, vitamin_id, cb) {
      App.api('/prescription/' + prescription_id + '/vitamin').post({
	vitamin_id: vitamin_id
      }).success(function(res) {
	cb(null, res);
      }).error(function(res) {
	cb(res);
      });
    },

    destroyVitamin: function(prescription_id, vitamin_id, cb) {
      if (!vitamin_id) {
	var e = prescription_id;
	var prescription = Elem.getClosest(e.target, '.prescription');
	var vitamin = Elem.getClosest(e.target, '.vitamin');
	prescription_id = parseInt(prescription.dataset.id, 10);
	vitamin_id = parseInt(vitamin.dataset.id, 10);
      }

      if (!cb) {
	cb = function(err) {
	  if (err) Log.error(err);
	};
      }

      App.api('/prescription/' + prescription_id + '/vitamin').del({
	vitamin_id: vitamin_id
      }).success(function(res) {
	cb(null, res);
      }).error(function(res) {
	cb(res);
      });

      if (vitamin) vitamin.parentNode.removeChild(vitamin);
    },

    showDrafts: function(id) {
      // TODO - Loading

      User.read(Me.username, 'drafts', {}, function(err, prescriptions) {
	if (err) Log.error(err);

	var elem = Elem.create({ className: 'list' , attributes: { empty: 'There are no drafts you can add this vitamin to.' }});
	var frag = document.createDocumentFragment();

	prescriptions.forEach(function(p) {
	  var image_url;
	  if (p.image_url && p.image_url.indexOf('/tmp') === -1)
	    image_url = p.image_url.replace('-original', '-900');

	  var vitaminCount = function(count) {
	    return count + ' Vitamin' + (count > 1 ? 's': '');
	  };

	  p.artwork = image_url || p.image_url;

	  var item = Elem.create({
	    className: 'i i-left i-right',
	    attributes: { 'data-id': p.id }
	  });

	  Elem.create({
	    className: 'left avatar',
	    parent: item,
	    childs: [{
	      tag: 'img',
	      attributes: {
		src: p.artwork
	      }
	    }]
	  });

	  Elem.create({
	    className: 'i-body',
	    parent: item,
	    childs: [{
	      tag: 'h5',
	      className: 'i-title',
	      text: p.description || '(empty description)'
	    }, {
	      tag: 'p',
	      className: 'i-description',
	      html: '<small>' + vitaminCount(p.vitamins.length) + '</small>'
	    }]
	  });

	  var button = Elem.create({
	    tag: 'button',
	    className: 'sm rnd success right',
	    text: 'Add',
	    parent: item
	  });

	  if (Utils.exists(p.vitamins, id)) {
	    button.classList.add('active');
	  }

	  button.onclick = function() {
	    var isActive = button.classList.contains('active');
	    var cb = function(err) {
	      if (err) button.classList.toggle('active', isActive);
	    };

	    if (isActive) {
	      Prescription.destroyVitamin(p.id, id, cb);
	    } else {
	      Prescription.addVitamin(p.id, id, cb);
	    }
	    button.classList.toggle('active');
	  };

	  frag.appendChild(item);
	});

	elem.appendChild(frag);

	Modal.show({
	  html: pDrafts({id: id}),
	  header: 'Drafts',
	  elem: elem,
	  close: true
	});

      });
    },

    setImage: function(id) {
      var self = this;
      var minWidth = 800;

      var elem = Elem.create({
	className: 'set-image'
      });

      var img = Elem.create({
	tag: 'img'
      });

      var select = Elem.create({
	tag: 'button',
	className: 'rnd select',
	text: 'select image'
      });

      select.onclick = function(e) {
	var blob = Utils.dataURItoBlob(img.src);

	var l = Loading.render();
	select.innerHTML = null;
	select.appendChild(l);

	var left = l.querySelector('.md-left .md-half-circle');
	var right = l.querySelector('.md-right .md-half-circle');
	var gap = l.querySelector('.md-gap');

	Upload.send(blob, function(progress) {
	  var i = Math.floor(progress);

	  if (progress < 50) {
	    left.style.transform = 'rotate(135deg)';
	    right.style.transform = 'rotate(' + (i / 50 * 180 - 135) + 'deg)';
	    gap.style.borderBottomColor = 'transparent';
	  } else {
	    left.style.transform = 'rotate(' + ((i - 50) / 50 * 180 + 135) + 'deg)';
	    right.style.transform = 'rotate(45deg)';
	  }

	  l.classList.toggle('show', i !== 0 && i !== 100);

	}, function(path) {
	  var cb = function(err) {
	    if (err) Log.error(err);
	  };

	  self.update(id, {
	    image: path
	  }, cb);

	  Modal.close(e);

	  var prescriptions = document.querySelectorAll('.prescription[data-id="' + id + '"]');
	  Elem.each(prescriptions, function(p) {
	    var img = p.querySelector('.i-image');

	    if (img) {
	      if (img.tagName === 'IMG') img.src = path;
	      else
		img.style['background-image'] = 'url(' + path + ')';
	    } else {
	      //TODO - detect single
	      var single = false;
	      if (single) {
		img = document.createElement('img');
		img.src = path;
	      } else {
		img = document.createElement('a');
		img.style['background-image'] = 'url(' + path + ')';
		img.href = '/prescription/' + id;
	      }
	      img.classList.add('i','i-image');

	      p.insertBefore(img, p.firstChild);
	    }
	  });
	});
      };

      var form = Elem.create({
	tag: 'form',
	childs: [{
	  tag: 'input',
	  className: 'pill',
	  attributes: {
	    type: 'text',
	    placeholder: 'paste an image URL'
	  }
	}]
      });

      form.onsubmit = function(e) {
	var url = e.target.querySelector('input').value;

	if (!Utils.isUrl(url)) {
	  Notification.show({msg: 'Not a valid url'});
	  return false;
	}

	var i = new Image(),
	    canvas = document.createElement('canvas'),
	    ctx = canvas.getContext('2d');

	i.crossOrigin = 'Anonymous';
	i.onload = function() {
	  if (i.width >= minWidth) {
	    canvas.width = i.width,
	    canvas.height = i.height;
	    ctx.drawImage(i, 0,0);
	    var dataUri = canvas.toDataURL();
	    img.src = dataUri;
	  } else {
	    Notification.show({msg: 'image must be at least ' + minWidth + 'px wide'});
	  }
	};

	i.src = CONFIG.api + '/image?' + [
	  'token=' + (window.localStorage.token || App.token),
	  'url=' + url
	].join('&');

	return false;
      };

      var upload = Elem.create({
	tag: 'button',
	className: 'rnd upload',
	text: 'select image from computer'
      });

      var input = Elem.create({
	tag: 'input',
	attributes: {
	  type: 'file',
	  value: 'image/*'
	}
      });

      input.onchange = function(e) {

	var fr = new FileReader();
	fr.onload = function() {
	  var i = new Image();
	  i.onload = function() {
	    if (i.width >= minWidth) {
	      img.src = fr.result;
	    } else {
	      Notification.show({msg: 'image must be at least ' + minWidth + 'px wide'});
	    }
	  };
	  i.src = fr.result;
	};
	fr.readAsDataURL(e.target.files[0]);
      };

      var inputs = Elem.create({
	className: 'inputs'
      });

      upload.appendChild(input);
      inputs.appendChild(form);
      inputs.appendChild(upload);

      elem.appendChild(img);
      elem.appendChild(select);
      elem.appendChild(inputs);

      Modal.show({
	elem: elem,
	header: 'Set Image',
	close: true
      });

    }
  };
});
