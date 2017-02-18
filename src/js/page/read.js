/* global page, Page, View, Vitamin, Log, document, Vitamins */
(function() {

  var init = function(ctx, next) {
    Page.read(ctx.params.id, null, null, function(err, page) {
      if (err) {
	page('/');
      } else {
	ctx.state.page = page;
	ctx.save();
	next();
      }
    });
  };

  var read = function(ctx) {

    var offset = 0;
    var load = function() {
      var r = document.getElementById('river');
      var l = r.querySelector('.list');

      Page.read(ctx.params.id, 'vitamins', {
	offset: offset
      }, function(err, data) {
	if (err) {
	  Log.error(err);
	} else {
	  if (data.length < 10) View.scrollOff();
	  offset += data.length;

	  var frag = document.createDocumentFragment();
	  data.forEach(function(v) {
	    frag.appendChild(Vitamin.render(v));
	  });

	  l.appendChild(frag);
	}

	delete r.dataset.loading;
      });
    };

    View.render({
      id: '/page/read.html',
      load: load
    });

    document.getElementById('page').appendChild(Page.render(ctx.state.page, {
      subscribe: true,
      single: true,
      meta: true,
      shuffle: true
    }));
  };

  page('/page/:id/:subpath?', init, read);

})();
