'use strict';
var fs = require('fs');

var tempDir = '.ns-exports',
    ssDir = tempDir + '/ss',
    metaDir = tempDir + '/meta',
    dataDir = tempDir + '/data';

exports.nsDir = tempDir;
exports.ssDir = ssDir;
exports.metaDir = metaDir;
exports.dataDir = dataDir;

exports.saveJSON = function(dir, obj) {
    fs.write(dir, JSON.stringify(obj, null, '   '), 'w');
};