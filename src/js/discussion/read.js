/* global Discussion, page, View, document, Me */
(function() {

    var load = function(ctx, next) {
	Discussion.read(ctx.params.id, function(err, discussion) {
	    if (err) {
		page('/');
	    } else {
		ctx.state.discussion = discussion;
		ctx.save();
		next();
	    }
	});
    };

    var show = function(ctx) {

	View.render({ id: '/discussion/read.html' });

	View.scrollOff();

	var discussion = Discussion.render(ctx.state.discussion, { single: true });

	document.getElementById('discussion').appendChild(discussion);

	delete document.getElementById('river').dataset.loading;

    };

    var create = function() {
	View.render({ id: '/discussion/read.html' });
	View.scrollOff();

	var discussion = Discussion.render({
	    title: null,
	    description: null,
	    total_comments: 0,
	    comments: [],
	    votes: [],
	    user: Me.data,
	    created_at: null
	}, { single: true });

	document.getElementById('discussion').appendChild(discussion);

	delete document.getElementById('river').dataset.loading;
    };

    page('/discussion/create', create);
    page('/discussion/:id', load, show);    

})();
