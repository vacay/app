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

	    View.scrollOff();

	    var nowplaying = Elem.create();
	    nowplaying.appendChild(Elem.create({
		className: 'h _d',
		childs: [{
		    tag: 'a',
		    text: 'Nowplaying'
		}]
	    }));

	    if (ctx.state.room.nowplaying)
		nowplaying.appendChild(Vitamin.render(ctx.state.room.nowplaying));

	    var users = Elem.create();
	    users.appendChild(Elem.create({
		className: 'h _d',
		childs: [{
		    tag: 'a',
		    text: 'Users in the room'
		}]
	    }));
	    var frag = document.createDocumentFragment();
	    ctx.state.room.users.forEach(function(u) {
		frag.appendChild(User.render(u));
	    });
	    users.appendChild(frag);

	    l.appendChild(nowplaying);
	    l.appendChild(users);
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
