/* global */
(function() {

    var init = function(ctx, next) {
	var id = decodeURIComponent(ctx.path.split('/').pop());
	Room.read(id, function(err, room) {
	    if (err) {
		page('/');
	    } else {
		ctx.state.room = room;
		ctx.save();
		next();
	    }
	});
    };

    var read = function(ctx) {
	var load = function() {
	    var r = document.getElementById('river');
	    var l = r.querySelector('.list');
	    var frag = document.createDocumentFragment();

	    View.scrollOff();

	    l.appendChild(Elem.create({
		className: 'h _d',
		childs: [{
		    tag: 'a',
		    text: 'Users in the room'
		}]
	    }));

	    ctx.state.room.users.forEach(function(u) {
		frag.appendChild(User.render(u));
	    });

	    l.appendChild(frag);
	    delete r.dataset.loading;	    
	};

	View.render({
	    id: '/room/read.html',
	    load: load
	});

	document.getElementById('room').appendChild(Room.render(ctx.state.room));
    };

    page('/room/:id', init, read);
    
})();
