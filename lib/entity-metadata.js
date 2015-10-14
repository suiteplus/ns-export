'use strict';
var fs = require('fs'),
    all = require('./metadata/all');
//var u = '/app/common/custom/entitycustfield.nl';

var $entityNames;
exports.getEntityNames = function() {
    if ($entityNames) {
        return $entityNames;
    } else {
        var entities = {};
        for (var e = 0; e < all.length; e++) {
            var entity = all[e];
            if (!entity.name) continue;

            entities['' + entity.id] = entity.name.toLowerCase().replace(/ /g, '-');
        }
        return ($entityNames = entities);
    }
};

exports.getEntities = function() {
    var entities = {},
        entityNames = exports.getEntityNames(),
        entityIds = Object.keys(entityNames),
        emptyEntity = require('./metadata/empty.json');
    for (var e = 0; e < entityIds.length; e++) {
        var id = entityIds[e],
            name = entityNames[id];
        if (!name) continue;

        var path = './metadata/'+name+'.json';
        if (!fs.exists(path)) {
            var entity = JSON.parse(JSON.stringify(emptyEntity));
            entity.code = name;
            entity.name = name;
            entity.id = parseInt(id);
            entities[id] = entity;
        } else {
            entities[id] = require(path);
        }
    }
    return entities;
};