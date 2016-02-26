/* global Elem, showdown, App, Discussion, Utils, Me, Comment, Log, page, Markdown, User, Notification */
(function(root, factory) {

    root.Discussion = factory(root);

})(this, function() {

    'use strict';

    var d = function(id) {
	return '/discussion/' + id;
    };

    var c = function(id) {
	return '/comment/' + id;
    };

    return {
	render: function(data, opts) {
	    opts = opts || {};

	    var elem = Elem.create({ className: 'c discussion' });
	    elem.dataset.id = data.id;

	    var author = User.render(data.user);
	    elem.appendChild(author);

	    var o = {
		tag: opts.single ? 'h3' : 'a',
		text: data.title,
		className: 'i i-title',
		attributes: {}
	    };
	    if (!opts.single) o.attributes.href = '/discussion/' + data.id;
	    else o.attributes.placeholder = 'Write a title for your discussion';

	    var title = Elem.create(o);
	    elem.appendChild(title);

	    if (opts.single) {
		var text;

		var converter = new showdown.Converter();
		var description = Elem.create({ className: 'i _m' });
		description.setAttribute('placeholder', 'What would you like to discuss?');
		description.innerHTML = converter.makeHtml(data.description);
		elem.appendChild(description);

		if (!data.id) {
		    elem.classList.add('editable');
		    description.contentEditable = 'true';
		    title.contentEditable = 'true';
		}
	    }

	    var meta = Elem.create({
		className: 'i',
		childs: [{
		    tag: 'small',
		    className: 'votes'
		}, {
		    tag: 'small',
		    text: Utils.fromNow(data.updated_at)
		}, {
		    tag: 'small',
		    text: data.total_comments + ' comment' + (data.total_comments === 1 ? '' : 's')
		}]
	    });
	    elem.appendChild(meta);

	    Discussion.updateVoteUI(elem, data.votes);

	    var actions = Elem.create({ className: 'i actions' });

	    if (data.id && Me.id) {
		var idx, v;
		var toggleVote = function(vote) {
		    idx = Utils.find(data.votes, Me.id, 'user_id');
		    v = data.votes[idx];
		    if (v && v.vote === vote) {
			data.votes.splice(idx, 1);
			Discussion.vote.destroy(data.id, function(err) {
			    if (err) Log.error(err);
			});
		    } else {
			if (idx === -1) {
			    data.votes.push({
				user_id: Me.id,
				vote: vote
			    });
			} else {
			    vote === 1 ? downvote.classList.remove('active') : upvote.classList.remove('active');
			    data.votes[idx].vote = vote;
			}
			Discussion.vote.create(data.id, {
			    vote: vote
			}, function(err) {
			    if (err) Log.error(err);
			});
		    }

		    Discussion.updateVoteUI(elem, data.votes);
		};

		var upvote = Elem.create({
		    tag: 'button',
		    className: 'xs rnd success',
		    text: '+'
		});
		upvote.onclick = function(e) {
		    e.target.classList.toggle('active');
		    toggleVote(1);
		};
		actions.appendChild(upvote);

		var downvote = Elem.create({
		    tag: 'button',
		    className: 'xs rnd failure',
		    text: '-'
		});
		downvote.onclick = function(e) {
		    e.target.classList.toggle('active');
		    toggleVote(-1);
		};
		actions.appendChild(downvote);

		idx = Utils.find(data.votes, Me.id, 'user_id');
		v = data.votes[idx];
		if (v)
		    v.vote === 1 ? upvote.classList.add('active') : downvote.classList.add('active');

		var reply = Elem.create({
		    tag: 'button',
		    className: 'link reply',
		    text: 'reply'
		});
		reply.onclick = function() {
		    var comment = Comment.render({
			body: null,
			user: Me.data,
			parent_id: null,
			discussion_id: data.id,
			votes: [],
			comments: [],
			created_at: new Date()
		    });
		    var i = Elem.create({ className: 'c' });
		    i.appendChild(comment);

		    comments.insertBefore(i, comments.firstChild);
		};
		actions.appendChild(reply);
	    }

	    if (data.user.username === Me.username) {
		var publish = Elem.create({
		    tag: 'button',
		    className: 'link save',
		    text: data.id ? 'save' : 'publish'
		});
		publish.onclick = function() {

		    var editable = elem.classList.contains('editable');
		    var t = Elem.text(title);
		    var b;

		    if (editable) {
			b = Elem.text(description);
			description.innerHTML = Markdown.html(b);
		    } else {
			b = text;
		    }

		    if (!t) {
			Notification.show({msg: 'Your discussion title is empty'});
			return;
		    }

		    if (!b) {
			Notification.show({msg: 'Your discussion description is empty'});
			return;
		    }

		    if (data.id) {
			Discussion.update(data.id, {
			    title: t,
			    description: b
			}, function(err, discussion) {
			    if (err) Log.error(err);
			    data.description = discussion.description;
			});
		    } else {
			Discussion.create({
			    title: t,
			    description: b
			}, function(err, discussion) {
			    if (err) Log.error(err);
			    page('/discussion/' + discussion.id);
			});
		    }

		    text = null;
		    edit.innerHTML = 'edit';
		    title.contentEditable = 'false';
		    description.contentEditable = 'false';
		    elem.classList.remove('editable');
		    elem.classList.remove('editing');
		};
		actions.appendChild(publish);

		var edit = Elem.create({
		    tag: 'button',
		    className: 'link',
		    text: data.id ? 'edit' : 'preview'
		});
		edit.onclick = function(e) {

		    var editable = !elem.classList.contains('editable');

		    if (editable) {
			e.target.innerHTML = 'preview';
			description.innerHTML = null;
			description.innerHTML = Markdown.text(text || data.description);
			description.contentEditable = 'true';
			title.contentEditable = 'true';
		    } else {
			e.target.innerHTML = 'edit';
			description.contentEditable = 'false';

			var c = Elem.text(description);
			if (c !== data.description) text = c;

			description.innerHTML = Markdown.html(c);

			title.contentEditable = 'false';
			title.textContent = data.title;
		    }

		    elem.classList.toggle('editable', editable);
		    elem.classList.toggle('editing', text);
		};
		actions.appendChild(edit);

	    }

	    if (opts.single) {

		elem.appendChild(actions);

		var container = Elem.create();
		container.appendChild(elem);

		var comments = Elem.create({ className: 'comments' });
		data.comments.forEach(function(c) {
		    var i = Elem.create({ className: 'c' });
		    i.appendChild(Comment.render(c));
		    comments.appendChild(i);
		});
		container.appendChild(comments);

		return container;
	    }

	    return elem;
	    
	},

	updateVoteUI: function(elem, votes) {
	    var count = 0;
	    votes.forEach(function(v) { count += v.vote; });
	    elem.querySelector('.votes').innerHTML = count + ' Point' + (count > 1 ? 's' : '');
	},

	browse: function(params, cb) {
	    App.api('/discussions').get(params).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	create: function(data, cb) {
	    App.api('/discussion').post(data).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	read: function(id, cb) {
	    App.api(d(id)).get().success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	update: function(id, data, cb) {
	    App.api(d(id)).put(data).success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	watch: function(id, cb) {
	    App.api(d(id) + '/watch').post().success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	unwatch: function(id, cb) {
	    App.api(d(id) + '/watch').del().success(function(res) {
		cb(null, res.data);
	    }).error(function(res) {
		cb(res, null);
	    });
	},

	comment: {

	    create: function(id, data, cb) {
		App.api(d(id) + '/comment').post(data).success(function(res) {
		    cb(null, res.data);
		}).error(function(res) {
		    cb(res, null);
		});
	    },

	    update: function(id, cid, data, cb) {
		App.api(d(id) + c(cid)).put(data).success(function(res) {
		    cb(null, res.data);
		}).error(function(res) {
		    cb(res, null);
		});
	    },

	    destroy: function(id, cid, cb) {
		App.api(d(id) + c(cid)).del().success(function(res) {
		    cb(null, res.data);
		}).error(function(res) {
		    cb(res, null);
		});
	    },

	    vote: {

		create: function(id, cid, data, cb) {
		    App.api(d(id) + c(cid) + '/vote').post(data).success(function(res) {
			cb(null, res.data);
		    }).error(function(res) {
			cb(res, null);
		    });
		},

		destroy: function(id, cid, cb) {
		    App.api(d(id) + c(cid) + '/vote').del().success(function(res) {
			cb(null, res.data);
		    }).error(function(res) {
			cb(res, null);
		    });
		}

	    }
	},

	vote: {

	    create: function(id, data, cb) {
		App.api(d(id) + '/vote').post(data).success(function(res) {
		    cb(null, res.data);
		}).error(function(res) {
		    cb(res, null);
		});
	    },

	    destroy: function(id, cb) {
		App.api(d(id) + '/vote').del().success(function(res) {
		    cb(null, res.data);
		}).error(function(res) {
		    cb(res, null);
		});
	    }

	}
    };
});
