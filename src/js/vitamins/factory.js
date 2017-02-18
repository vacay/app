/* global Elem, Player */
(function(root, factory) {

  root.Vitamins = factory(root);

})(this, function() {

  'use strict';

  return {
    renderShuffle: function(opts) {
      return Elem.create({
	tag: 'button',
	className: 'sm rnd',
	html: '<i class="icon-shuffle"></i> ' + opts.title,
	onclick: function() {
	  Player.play(null, opts);
	}
      });
    }
  };
});
