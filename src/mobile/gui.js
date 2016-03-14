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

	    if (Platform.isAndroid()) {
		Request.get('https://vacay.io/mobile/package.json').success(function(data) {
		    if (Utils.newerVersion(data.version, v)) {
			Notification.show({
			    msg: 'Update Available',
			    action: {
				text: 'Download',
				onclick: function() {
				    View.open('https://vacay.io/mobile/android.apk');
				}
			    }
			});
		    }
		}).error(function(data) {
		    Log.error(data);
		});
	    }
	});
    }
});
