/* global Platform, StatusBar, window, document */

Platform.ready(function() {
    if (Platform.isAndroid()){
	window.addEventListener('resize', function(){
	    if (document.activeElement.tagName === 'INPUT') {
		window.setTimeout(function(){
		    document.activeElement.scrollIntoViewIfNeeded();
		}, 0);
	    }
	});

	document.addEventListener('backbutton', function(e) {
	    if (Modal.exists())
		Modal.closeAll();
	    else if (window.history.length)
		App.back();
	});
    } else {
	StatusBar && StatusBar.hide();
    }

    if (cordova.getAppVersion) {
	cordova.getAppVersion.getVersionNumber(function (v) {
	    document.getElementById('version').innerHTML = v;
	});
    }
});
