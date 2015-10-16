#!/usr/bin/env node

'use strict';

var yarr = require('yargs')
    .usage('Usage: ns-export-metadata <command> <file> [options]')
    .command('recType', 'Name of Record Type, example:"customer" or "customrecord_japo".')
    .command('id', 'ID of data in Record Type.')
    .demand(1)
    .demand(2)
    .describe('depth','Depth of join with others Records. Default: 1.').alias('depth','d')
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

var _ = {
        extend: require('nsconfig/node_modules/lodash.assign')
    },
    osenv = require('nsconfig/node_modules/osenv');

// #####################################
// Fix nsconfig
// #####################################
function readConfFile(path) {
    var out = {};
    if (!fs.existsSync(path)) return out;
    try {
        var content = fs.readFileSync(path);
        out = JSON.parse(content);
    } catch (e) {
        //purposely ignore
        console.error(e);
    }

    return out;
}
var confFileGlobal = readConfFile(osenv.home() + '/.ns/nsconfig.json'),
    confFileLocal = readConfFile(__dirname + '/nsconfig');

var config = _.extend({}, confFileGlobal, confFileLocal);

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

    if (record && id) {
        config.downloads.push({
            record: record,
            id: id
        });
    } else {
        !record && console.error('>> Null Record Type');
        !id && console.error('>> Null ID');
        process.exit(0);
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


