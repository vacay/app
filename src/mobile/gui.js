/* global Platform, StatusBar, window, document */

Platform.ready(function() {


    if (cordova.plugins.backgroundMode) {
	cordova.plugins.backgroundMode.enable();
	cordova.plugins.backgroundMode.setDefaults({
	    title:  'Vacay',
	    ticker: 'Ticker',
	    text:   'Playing music in the background'
	});
	cordova.plugins.backgroundMode.onactivate = function () {
            setInterval(function () {
		var disable = Player.data.remote || !Room.name() || (!Player.data.status.playing && !Player.data.status.loading);
		Log.info('disable background mode: ', disable);

		if (disable)
		    cordova.plugins.backgroundMode.disable();
            }, 5000);
	};
    }

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
		var showNotification = function() {
		    Notification.show({
			msg: 'Update Available',
			action: {
			    text: 'Download',
			    onclick: function() {
				alert('make sure to uninstall this version before installing the new version');
				View.open('https://vacay.io/mobile/android.apk');
			    }
			}
		    });
		};

		Request.get('https://vacay.io/mobile/package.json').success(function(data) {
		    if (Utils.newerVersion(data.version, v)) {
			showNotification();
		    } else {
			cordova.getAppVersion.getVersionCode(function(build) {
			    if (Utils.newerVersion(data.build, build)) {
				showNotification();
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
