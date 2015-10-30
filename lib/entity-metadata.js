'use strict';
var fs = require('fs'),
    all = require('./metadata/all');
//var u = '/app/common/custom/entitycustfield.nl';

var $entityIds,
    $entityNames;
exports.getEntityIds = function() {
    if ($entityIds) {
        return $entityIds;
    } else {
        var entities = {};
        for (var e = 0; e < all.length; e++) {
            var entity = all[e];
            if (!entity.name) continue;

            var id = '' + entity.id,
                name = entity.name.toLowerCase().replace(/ /g, '');
            entities[id] = name;
        }
        return ($entityIds = entities);
    }
};
exports.getEntityNames = function() {
    if (!$entityNames) {
        $entityNames = {};
        var $entityIds = exports.getEntityIds();
        Object.keys($entityIds).forEach(function(id) {
            var name = $entityIds[id];
            $entityNames[name] = id;
        });
    }
    return $entityNames;
};

exports.getEntities = function(opt) {
    var entities = {},
        entityIds = exports.getEntityIds(),
        entityIdsList = Object.keys(entityIds),
        emptyEntity = require('./metadata/empty.json');

    for (var e = 0; e < entityIdsList.length; e++) {
        var id = entityIdsList[e],
            name = entityIds[id];
        if (!name) continue;

        var path = opt.dir + '/lib/metadata/' + name + '.json';
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