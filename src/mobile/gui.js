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
    } else {
	StatusBar && StatusBar.hide();
    }

    if (cordova.getAppVersion) {
	cordova.getAppVersion.getVersionNumber(function (v) {
	    document.getElementById('version').innerHTML = v;
	});
    }
});
