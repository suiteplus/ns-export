'use strict';

var yarr = require('yargs')
    .usage('Usage: ns-export-metadata <command> <file> [options]')
    .command('metadata', 'List of Metadatas.').alias('metadata', '-m')
    .command('all-metadata', 'All Metadatas.').alias('all-metadata', '-a')
    .demand(1)
    .demand(2)
    .describe('config','Point to a nsconfig.json file.')
    .describe('email','Account email.')
    .describe('password','Account password.')
    .describe('account','Account id.')
    .describe('realm','*.netsuite.com')
    .describe('role')
    .describe('script','Script id.')
    .describe('deployment','Deployment id.')
    .argv;

//var cabinet = require('./nscabinet.js'),
//    vinylfs = require('vinyl-fs');
//
//var action = yarr._[0],
//    file = yarr._[1];
//
//var opts = {};
//
//for (var it in yarr) {
//    if (yarr[it] !== undefined) opts[it] = yarr[it];
//}
//if (opts.rootpath) opts.rootPath = opts.rootpath;
//
//if ( action == 'u' ) {
//    vinylfs.src(file).pipe(cabinet(opts));
//} else if ( action == 'd' ) {
//    cabinet.download(file,opts).pipe(vinylfs.dest('.'));
//}

process.on('exit' , () => { console.log('\n') });
