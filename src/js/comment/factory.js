/* global Utils, Elem, showdown, User, Discussion, Log, Me, Markdown, Notification */
(function(root, factory) {

    root.Comment = factory(root);

})(this, function() {

    'use strict';

    return {
	render: function(data) {
	    var idx, v;
	    var self = this;

	    var elem = Elem.create({ className: 'i comment' });

	    var user = User.render(data.user, { avatarOnly: true, comment: true });
	    elem.appendChild(user);

	    var body = Elem.create({ className: 'i i-body' });
	    var converter = new showdown.Converter();	    
	    body.innerHTML = converter.makeHtml(data.body);

	    if (!data.id) {
		elem.classList.add('editable');
		body.contentEditable = 'true';
	    }

	    elem.appendChild(body);

	    var meta = Elem.create({
		className: 'i',
		childs: [{
		    tag: 'small',
		    className: 'votes'
		}, {
		    tag: 'small',
		    text: Utils.fromNow(data.updated_at)
		}]
	    });
	    elem.appendChild(meta);
	    Discussion.updateVoteUI(elem, data.votes);

	    if (Me.id && data.user.username) {

		var actions = Elem.create({ className: 'i actions' });

		var toggleVote = function(vote) {
		    idx = Utils.find(data.votes, Me.id, 'user_id');
		    v = data.votes[idx];
		    if (v && v.vote === vote) {
			data.votes.splice(idx, 1);
			Discussion.comment.vote.destroy(data.discussion_id, data.id, function(err) {
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
			Discussion.comment.vote.create(data.discussion_id, data.id, {
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
		    var comment = self.render({
			body: null,
			user: Me.data,
			parent_id: data.id,
			discussion_id: data.discussion_id,
			votes: [],
			comments: [],
			created_at: new Date()		    
		    });

		    comments.insertBefore(comment, comments.firstChild);
		};
		actions.appendChild(reply);

		if (data.user.username === Me.username) {
		    var publish = Elem.create({
			tag: 'button',
			className: 'link save',
			text: data.id ? 'save' : 'publish'
		    });
		    publish.onclick = function(e) {
			var editable = elem.classList.contains('editable');

			var b;
			if (editable) {
			    b = Elem.text(body);
			    body.innerHTML = Markdown.html(b);
			} else {
			    b = text;
			}

			if (!b) {
			    Notification.show({msg: 'Your comment is empty'});
			    return;
			}

			if (data.id) {
			    Discussion.comment.update(data.discussion_id, data.id, {
				body: b
			    }, function(err, comment) {
				if (err) Log.error(err);
				data.body = comment.body;
			    });
			} else {
			    Discussion.comment.create(data.discussion_id, {
				body: b,
				parent_id: data.parent_id
			    }, function(err, comment) {
				if (err) Log.error(err);
				data.id = comment.id;
				e.target.innerHTML = 'save';
			    });
			}

			text = null;
			body.contentEditable = 'false';
			edit.innerHTML = 'edit';			
			elem.classList.remove('editable');
			elem.classList.remove('editing');
		    };
		    actions.appendChild(publish);
		    
		    var edit = Elem.create({
			tag: 'button',
			className: 'link',
			text: data.id ? 'edit' : 'preview'
		    });

		    var text;
		    edit.onclick = function(e) {

			var editable = !elem.classList.contains('editable');

			if (editable) {
			    e.target.innerHTML = 'preview';

			    body.innerHTML = null;
			    body.innerHTML = Markdown.text(text || data.body);
			    
			    body.contentEditable = 'true';
			} else {
			    e.target.innerHTML = 'edit';
			    body.contentEditable = 'false';

			    var c = Elem.text(body);
			    if (c !== data.body) text = c;

			    body.innerHTML = Markdown.html(c);
			}

			elem.classList.toggle('editable', editable);
			elem.classList.toggle('editing', text);
		    };
		    actions.appendChild(edit);

		    var del = Elem.create({
			tag: 'button',
			className: 'link failure',
			text: 'delete'
		    });
		    del.onclick = function() {
			if (data.id) {
			    body.innerHTML = 'deleted';
			    elem.removeChild(actions);
			    Discussion.comment.destroy(data.discussion_id, data.id, function(err) {
				if (err) Log.error(err);
			    });
			} else {
			    //TODO - top level comment
			    elem.parentNode.removeChild(elem);
			}
			
		    };
		    actions.appendChild(del);
		}

		elem.appendChild(actions);
	    }

	    var comments = Elem.create({ className: 'comments' });
	    
	    data.comments.forEach(function(c) {
		comments.appendChild(self.render(c));
	    });
	    
	    elem.appendChild(comments);

	    return elem;
	}
    };
});
