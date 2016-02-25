/* global console, App, window, CryptoJS, document */
(function(root, factory) {

    root.Log = factory(root);

})(this, function() {

    'use strict';

    var FUNCTION_REGEX = /function\s*([\w\-$]+)?\s*\(/i;

    // Generate a browser stacktrace (or approximation) from the current stack.
    // This is used to add a stacktrace to `Bugsnag.notify` calls, and to add a
    // stacktrace approximation where we can't get one from an exception.
    function generateStacktrace() {
	var stacktrace;
	var MAX_FAKE_STACK_SIZE = 10;
	var ANONYMOUS_FUNCTION_PLACEHOLDER = '[anonymous]';

	// Try to generate a real stacktrace (most browsers, except IE9 and below).
	try {
	    throw new Error('');
	} catch (exception) {
	    stacktrace = stacktraceFromException(exception);
	}

	// Otherwise, build a fake stacktrace from the list of method names by
	// looping through the list of functions that called this one (and skip
	// whoever called us).
	if (!stacktrace) {
	    var functionStack = [];
	    try {
		var curr = arguments.callee.caller.caller;
		while (curr && functionStack.length < MAX_FAKE_STACK_SIZE) {
		    var fn = FUNCTION_REGEX.test(curr.toString()) ? RegExp.$1 || ANONYMOUS_FUNCTION_PLACEHOLDER : ANONYMOUS_FUNCTION_PLACEHOLDER;
		    functionStack.push(fn);
		    curr = curr.caller;
		}
	    } catch (e) {
		console.error(e);
	    }
	    stacktrace = functionStack;
	}

	// Tell the backend to ignore the first two lines in the stack-trace.
	// generateStacktrace() + window.onerror,
	// generateStacktrace() + notify,
	// generateStacktrace() + notifyException
	return stacktrace;
    }

    // Get the stacktrace string from an exception
    function stacktraceFromException(exception) {
	var stack = exception.stack || exception.backtrace || exception.stacktrace;
	return stack ? stack.split('\n') : null;
    }

    var report = function(exception, data) {
	try {

            var errorMessage = exception;
            var userAgent = window.navigator.userAgent;

	    var params = {
		error: {
		    errorUrl: window.location.href,
		    errorMessage: errorMessage,
		    stackTrace: (exception && stacktraceFromException(exception)) || generateStacktrace(),
		    userAgent: userAgent,
		    data: data || ''
		}
            };

	    var cache = [];
	    var hash = CryptoJS.MD5(JSON.stringify(params, function(key, value) {
		if (typeof value === 'object' && value !== null)
		    if (cache.indexOf(value) === -1) cache.push(value);

		return value;
	    })).toString();

	    cache = null;

	    if (!window.sessionStorage.getItem(hash)) {

		try {
		    window.sessionStorage.setItem(hash, new Date());
		} catch (e) {
		    console.warn( 'Saving error hash to session storage failed' );
		}

		App.api('/logger').post(params).success(function(res) {
		    console.info(res);
		}).error(function(res) {
		    console.error(res);
		});

	    }

        } catch ( loggingError ) {
            console.warn( 'Error logging failed' );
            console.info( loggingError );
        }
    };

    var throttledReport = window.Throttle(report);

    window.onerror = function (message, url, lineNo, charNo, exception) {
	if (message.indexOf('Script error.') > -1) return;
	throttledReport(exception || message, {
	    url: url,
	    lineNo: lineNo,
	    charNo: charNo
	});
    };    

    return {
	info: console.debug.bind(console),
	warn: console.warn.bind(console),
	debug: console.info.bind(console),
	error: function() {
	    console.error(Array.prototype.slice.call(arguments));
	    throttledReport(arguments);
	}
    };
});
