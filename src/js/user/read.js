/* global User, page, Me, Location, Elem, User, Prescription, Vitamin, Page, document, View, doT, Log, Vitamins, window */
(function() {

  var init = function(ctx, next) {
    if (ctx.state.user && ctx.state.user.username === ctx.params.id) {
      next();
    } else {
      User.read(ctx.params.id, null, null, function(err, user) {
	if (err) {
	  page('/');
	  return ;
	}
	ctx.state.user = user;
	ctx.save();
	next();
      });
    }
  };

  var read = function(ctx) {

    var search = Utils.search();

    ctx.state.user.isOwner = ctx.state.user.username === Me.username;

    var filterLoaded;

    var q, offset = 0;

    var load = function(options) {

      var self = this;
      var type, tags;
      var r = document.getElementById('river');
      var l = r.querySelector('.list');
      var intro = ctx.state.user.isOwner ? 'You have ' : ctx.params.id + ' has ';

      var subpath = ctx.params.subpath ? ctx.params.subpath.split('/').shift() : 'summary';

      switch(subpath) {
      case 'crate':
	l.setAttribute('empty', intro + 'not crated (saved) any vitamins (recordings).');
	type = 'vitamin';
	break;

      case 'tags':
	l.setAttribute('empty', intro + 'not tagged any vitamins');
	type = 'tag';
	break;

      case 'tag':
	l.setAttribute('empty', intro + 'no vitamins with this tag');
	type = 'vitamin';
	tags = ctx.path.split('/').pop().split('+');
	tags = tags.map(function(t) {
	  return decodeURIComponent(t);
	});

      case 'listens':
	l.setAttribute('empty', intro + 'no listening history.');
	type = 'vitamin';
	break;

      case 'imports':
	l.setAttribute('empty', intro + 'not added or uploaded to vacay.');
	type = 'vitamin';
	break;

      case 'prescriptions':
	l.setAttribute('empty', intro + 'not made any prescriptions.');
	type = 'prescription';
	break;

      case 'recommendations':
	l.setAttribute('empty', intro + 'not recommended any prescriptions.');
	type = 'prescription';
	break;

      case 'drafts':
	l.setAttribute('empty', intro + 'no prescription drafts (unpublished).');
	type = 'prescription';
	break;

      case 'pages':
	l.setAttribute('empty', intro + 'not subscribed to any pages.');
	type = 'page';
	break;

      case 'users':
	l.setAttribute('empty', intro + 'not subscribed to any people.');
	type = 'user';
	break;

      default:
	l.setAttribute('empty', intro + 'no activity to show.');
	type = 'summary';
	break;
      }

      if (options) {
	View.scrollOn();
	offset = 0;
	l.innerHTML = null;

	if (typeof options.q !== 'undefined') q = options.q;

	if (options.reset) {
	  document.querySelector('.filter-container input').value = q = null;
	}
      }

      var params = { offset: offset, limit: 10 };
      if (q) params.q = q;
      if (tags) params.tags = tags;
      
      User.read(ctx.params.id, subpath, params, function(err, data) {
	if (err) {
	  Log.error(err);
	} else {

	  var frag = document.createDocumentFragment();

	  if (type === 'summary') {
	    var crate = Elem.create({ className: 'crate' });
	    if (data.crate && data.crate.length) {
	      crate.appendChild(Elem.create({
		className: 'h _d',
		childs: [{
		  tag: 'a',
		  text: 'Recently Crated',
		  attributes: {
		    href: '/@' + ctx.params.id + '/crate'
		  }
		}]
	      }));
	      data.crate.forEach(function(v) {
		crate.appendChild(Vitamin.render(v));
	      });
	    }

	    var recommended = Elem.create({ className: 'recommended' });
	    if (data.recommended.length) {
	      recommended.appendChild(Elem.create({
		className: 'h _d',
		childs: [{
		  tag: 'a',
		  text: 'Most recommended prescriptions',
		  attributes: {
		    href: '/@' + ctx.params.id + '/prescriptions'
		  }
		}]
	      }));
	      data.recommended.forEach(function(p) {
		recommended.appendChild(Prescription.render(p));
	      });
	    }

	    var recommendations = Elem.create({ className: 'recommendations' });
	    if (data.recommendations.length) {
	      recommendations.appendChild(Elem.create({
		className: 'h _d',
		childs: [{
		  tag: 'a',
		  text: 'Recommendations',
		  attributes: {
		    href: '/@' + ctx.params.id + '/recommendations'
		  }
		}]
	      }));
	      data.recommendations.forEach(function(p) {
		recommendations.appendChild(Prescription.render(p));
	      });
	    }

	    frag.appendChild(crate);
	    frag.appendChild(recommended);
	    frag.appendChild(recommendations);

	    View.scrollOff();

	  } else {

	    if (data.length < 10 || ctx.params.subpath === 'tags')
	      View.scrollOff();

	    offset += data.length;

	    var f = document.querySelector('.filter-container');
	    if (!!offset && f && !filterLoaded) {
	      f.innerHTML = doT.template(View.tmpl('/filter/search.html'))({
		placeholder: ctx.params.subpath
	      });
	      filterLoaded = true;
	    }
	    
	    data.forEach(function(d) {
	      switch(type) {
	      case 'tag':
		frag.appendChild(Tag.render(d.value, { link: true, username: ctx.state.user.username }));
		break;

	      case 'vitamin':
		frag.appendChild(Vitamin.render(d));
		break;

	      case 'prescription':
		frag.appendChild(Prescription.render(d));
		break;

	      case 'page':
		frag.appendChild(Page.render(d, { subscribe: true, meta: true }));
		break;

	      case 'user':
		frag.appendChild(User.render(d, { subscribe: true, bio: true }));
		break;
	      }
	    });
	  }

	  l.appendChild(frag);
	}

	delete r.dataset.loading;
	View.active('.u [href="' + window.location.pathname + '"]');
      });

    };

    var opts = {
      id: '/user/read.html',
      data: ctx.state.user,
      load: load,
      title: '@' + ctx.params.id
    };

    if (['crate','listens','imports'].indexOf(ctx.params.subpath) !== -1)
      opts.filter = true;

    View.render(opts);

    document.getElementById('user').appendChild(User.render(ctx.state.user, {
      single: true,
      subscribe: true,
      bio: true,
      editable: ctx.state.user.isOwner,
      shuffle: true
    }));
  };

  page('/@:id/:subpath(.*)?', init, read);

})();
