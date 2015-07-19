var NwBuilder = require('nw-builder');
var nw = new NwBuilder({
    files: './desktop/**/**',
    version: '0.10.5',
    platforms: ['osx32'],
    buildDir: './dist',
    macIcns: './resources/mac/mac.icns'
});

nw.on('log',  console.log);

nw.build().then(function () {
    console.log('all done!');
}).catch(function (error) {
    console.error(error);
});
