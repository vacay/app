/* global document, Elem */

(function(root, factory) {

    root.Modal = factory(root);

})(this, function() {

    'use strict';

    return {

	show: function(opts) {
	    opts = opts || {};
	    var container = Elem.create({
		className: 'modal' + (opts.className ? ' ' + opts.className : '')
	    });

	    if (opts.style && typeof opts.style === 'object')
		for (var property in opts.style)
		    if (opts.style.hasOwnProperty(property))
			container.style[property] = opts.style[property];

	    var overlay = Elem.create({
		className: 'overlay'
	    });

	    overlay.onclick = this.close;

	    var content = Elem.create({
		className: 'content scroll'
	    });

	    if (opts.html) content.innerHTML = opts.html;
	    if (opts.elem) content.appendChild(opts.elem);

	    if (opts.confirm) {
		container.classList.add('confirm');

		var message = Elem.create({
		    tag: 'p',
		    text: opts.confirm.message || 'Are you sure?'
		});
		content.appendChild(message);

		var buttons = Elem.create({
		    className: 'row'
		});

		var confirm = Elem.create({
		    tag: 'button',
		    text: opts.confirm.text || 'Yes',
		    className: opts.confirm.className ? opts.confirm.className + ' col-xs' : 'success'
		});
		confirm.onclick = opts.confirm.click;
		buttons.appendChild(confirm);

		var cancel = Elem.create({
		    tag: 'button',
		    text: 'Cancel',
		    className: 'col-xs'
		});
		cancel.onclick = this.close;
		buttons.appendChild(cancel);

		content.appendChild(buttons);
	    } else {

		if (opts.header) {
		    var header = Elem.create({
			tag: 'header',
			text: opts.header || 'Modal'
		    });

		    content.insertBefore(header, content.firstChild);
		}

		if (opts.close) {
		    var close = Elem.create({
			tag: 'button',
			className: 'close'
		    });

		    close.onclick = this.close;

		    content.insertBefore(close, content.firstChild);
		}
	    }

	    container.appendChild(overlay);
	    container.appendChild(content);

	    document.body.appendChild(container);
	    document.body.classList.toggle('modal-open', true);
	},

	close: function(e) {
	    var modal = Elem.getClosest(e.target, '.modal');
	    modal.parentNode.removeChild(modal);
	    document.body.classList.toggle('modal-open', false);
	},

	closeAll: function() {
	    var divs = document.querySelectorAll('.modal');

	    Elem.each(divs, function(div) {
		div.parentNode.removeChild(div);
	    });
	    document.body.classList.toggle('modal-open', false);
	}

    };

});
