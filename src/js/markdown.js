/* global showdown */
(function(root, factory) {

    root.Markdown = factory(root);

})(this, function() {

    'use strict';

    var LINEBREAK_REGEX = /\n/g,
	BR_REGEX = /<(br|p|div)(\/)?>/g,
	TAG_REGEX = /<.+?>/g,
	NBSP_REGEX = /&nbsp;/g,
	BLOCKQUOTE_REGEX = /&gt;/g,
	TRIPLE_LINEBREAK_REGEX = /\n\n\n/g, // Make sure to scrub triple line breaks... they don't make much sense in MD.
	DOUBLE_SPACE_REGEX = /\s\s/g;    

    return {
	text: function(s) {
	    if (s) {
		s = s.replace(LINEBREAK_REGEX, '<br/>');
		s = s.replace(DOUBLE_SPACE_REGEX, '&nbsp; ');
	    }
	    return s;
	},
	html: function(s) {
	    var html = s;
	    html = html.replace(BR_REGEX, '\n');
	    html = html.replace(TAG_REGEX, '');
	    html = html.replace(NBSP_REGEX, ' ');
	    html = html.replace(BLOCKQUOTE_REGEX, '>');
	    html = html.replace(TRIPLE_LINEBREAK_REGEX, '\n\n');
	    var converter = new showdown.Converter();
	    return converter.makeHtml(html);
	    
	}
    };

});
