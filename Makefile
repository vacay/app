CPLATFORM=cordova platform
CPLUGIN=cordova plugin
NW=/Applications/node-webkit.app/Contents/MacOS/node-webkit

define release
    VERSION=`node -pe "require('./desktop/package.json').version"` && \
    NEXT_VERSION=`node -pe "require('semver').inc(\"$$VERSION\", '$(1)')"` && \
    node -e "\
        var j = require('./desktop/package.json');\
        j.version = \"$$NEXT_VERSION\";\
        var s = JSON.stringify(j, null, 4);\
        require('fs').writeFileSync('./desktop/package.json', s);" && \
    git commit -m "Desktop Version $$NEXT_VERSION" -- desktop/package.json && \
    git tag "desktop-v$$NEXT_VERSION" -m "Desktop Version $$NEXT_VERSION"
endef


cordova:
	if [ ! -d './platforms/ios' ]; then $(CPLATFORM) add ios; fi
	if [ ! -d './platforms/android' ]; then $(CPLATFORM) add android; fi
	if [ ! -d './plugins/cordova-plugin-statusbar' ]; then $(CPLUGIN) add cordova-plugin-statusbar; fi
	if [ ! -d './plugins/cordova-plugin-device' ]; then $(CPLUGIN) add cordova-plugin-device; fi
	if [ ! -d './plugins/com.rd11.remote-controls' ]; then $(CPLUGIN) add https://github.com/jcesarmobile/RemoteControls.git; fi
	if [ ! -d './plugins/cordova-plugin-file-transfer' ]; then $(CPLUGIN) add cordova-plugin-file-transfer; fi
	if [ ! -d './plugins/cordova-plugin-network-information' ]; then $(CPLUGIN) add cordova-plugin-network-information; fi
	if [ ! -d './plugins/nl.kingsquare.cordova.background-audio' ]; then $(CPLUGIN) add https://github.com/AubreyHewes/cordova-background-audio.git; fi
	if [ ! -d './plugins/cordova-plugin-app-version' ]; then $(CPLUGIN) add cordova-plugin-app-version; fi
	if [ ! -d './plugins/cordova-plugin-inappbrowser' ]; then $(CPLUGIN) add cordova-plugin-inappbrowser; fi
	if [ ! -d './plugins/cordova-plugin-music-controls' ]; then $(CPLUGIN) add https://github.com/homerours/cordova-music-controls-plugin; fi
	if [ ! -d './plugins/cordova-plugin-background-mode' ]; then $(CPLUGIN) add https://github.com/katzer/cordova-plugin-background-mode.git; fi

	cordova prepare

npm:
	npm prune
	npm install -l

bower:
	bower prune
	bower install

update: npm cordova

## Web
deploy_web:
	grunt production
	rsync -av --delete ./www/index.html deploy@34.207.181.14:/home/deploy/app/index.html
	rsync -av --delete ./resources/favicon.ico deploy@34.207.181.14:/home/deploy/app/favicon.ico

deploy_staging:
	grunt production
	aws s3 cp www/index.html s3://staging.vacay.io/index.html
	aws s3 cp resources/favicon.ico s3://staging.vacay.io/favicon.ico

remove_staging:
	aws s3 rm s3://staging.vacay.io/index.html
	aws s3 rm s3://staging.vacay.io/favicon.ico

## Desktop

release_patch_desktop:
	@$(call release,patch)

release_minor_desktop:
	@$(call release,minor)

release_major_desktop:
	@$(call release,major)

run_desktop:
	DEBUG=* $(NW) desktop

build_desktop:
	grunt
	if [ -d './dist/vacay/osx32' ]; then rm -rf ./dist/vacay/osx32; fi
	node build/nw.js
	cp resources/mac/ffmpegsumo.so "dist/vacay/osx32/vacay.app/Contents/Frameworks/node-webkit Framework.framework/Libraries/"

deploy_desktop: build_desktop
	cd dist/vacay/osx32 && rm -f vacay.zip && zip -r vacay vacay.app
	rsync -avz --delete ./dist/vacay/osx32/vacay.zip deploy@52.21.6.168:/home/deploy/app/desktop/osx32/vacay.zip
	rsync -av --delete ./desktop/package.json deploy@52.21.6.168:/home/deploy/app/desktop/package.json

deploy_android: build_android
	rsync -avz --delete ./dist/android.apk deploy@52.21.6.168:/home/deploy/app/mobile/android.apk
	rsync -av --delete ./mobile.json deploy@52.21.6.168:/home/deploy/app/mobile/package.json

## Mobile
build_mobile: update
	grunt production
	grunt string-replace:cordova

emulate_ios: build_mobile
	cordova emulate ios

build_ios: build_mobile
	cordova build ios

emulate_android: build_mobile
	cordova emulate android

run_android: build_mobile
	cordova run android

build_android: build_mobile
	cordova build --release android
	jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore android-release-key.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk alias_name
	if [ -a 'dist/android.apk' ]; then rm dist/android.apk; fi
	zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk dist/android.apk
