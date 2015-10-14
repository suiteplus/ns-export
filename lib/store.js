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

exports.saveJSON = function(file, obj) {
    fs.write(file, JSON.stringify(obj, null, '  '), 'w');
};

exports.reSaveJSON = function(file, obj) {
    fs.exists(file) && fs.remove(file);
    exports.saveJSON(file, obj);
};