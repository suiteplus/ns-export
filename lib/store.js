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

exports.saveData = function(type, obj, append) {
    var file = exports.dataDir + '/' + type + '.json',
        exists = fs.exists(file);
    if (exists) {
        if (append === true) {
            var data = fs.read(file);
            obj = data.concat(obj);
        } else {
            fs.exists(file) && fs.remove(file);
        }
    }
    fs.write(file, JSON.stringify(obj, null, '  '), 'w');
    console.log((exists ? 're-': '') + 'saved >> Data "' + type + '" in "' + file + '"');
};

exports.saveMetadata = function(obj) {
    var type = obj.code,
        file = exports.metaDir + '/' + type + '.json',
        exists = fs.exists(file);
    exists && fs.remove(file);
    fs.write(file, JSON.stringify(obj, null, '  '), 'w');
    console.log((exists ? 're-': '') + 'saved >> Metadata "' + type + '" in "' + file + '"');
};