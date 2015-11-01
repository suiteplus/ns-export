#!/usr/bin/env node

'use strict';

var yarr = require('yargs')
    .usage('Usage: nsexport <command> [options]')
    .command('<recType> <id>', 'Record Type and ID, "nsexport customrecord_japo 122"')
    .command('<file>', 'JSON Array of Record Types and IDs, "nsexport ./records.json"')
    .demand(1)
    //.demand(2)
    .describe('depth','Depth of join with others Records. Default: 1.').alias('depth','d')
    .describe('bundle', 'Bundle ID').alias('bundle', 'b')
    .describe('email','Account email.').alias('email','e')
    .describe('password','Account password.').alias('password','p')
    .describe('account','Account id.').alias('account','a')
    .argv;

var child = require('child_process'),
    //nsconfig = require('nsconfig'),
    fs = require('fs'),
    spawn = child.spawn;

var bin = __dirname + '/node_modules/.bin/phantomjs',
    args = [__dirname + '/index.js', __dirname],
    //config = nsconfig({}, true),
    //configObj = JSON.stringify(config),
    dir = '.ns-exports';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

var nsconfig = require('nsconfig'),
    custom_params = [{ name : 'quiz' , required : true }],
    config = nsconfig({}, custom_params);

// #####################################
// read command line options
// #####################################
var record = yarr._[0],
    id = yarr._[1];

for (var it in yarr) {
    if (yarr[it]) {
        config[it] = yarr[it];
    }
}

if (!config.downloads || (record && id)) {
    config.downloads = [];

    if (record === '*') {
        config.downloads = [];
    } else if (record && id) {
        config.downloads.push({
            record: record,
            id: id
        });
    } else {
        var file = record;
        config.downloads = require(file);
    }
}

var configObj = JSON.stringify(config);
fs.writeFileSync(dir + '/nsconfig.json', configObj, 'utf8');

var cspr = spawn(bin, args);

cspr.stdout.on('data', function (data) {
    var buff = new Buffer(data);
    console.log(buff.toString('utf8').trim());
});

cspr.stderr.on('data', function (data) {
    data += '';
    console.log(data.replace('\n', '\nstderr: '));
});

cspr.on('exit', function (code) {
    process.exit(code);
    console.log('\n');
});


