'use strict';

//var u = '/app/common/custom/entitycustfield.nl';

var all = require('./metadata/all');

exports.getEntities = function() {
    var entities = {};
    for (var e = 0; e < all.length; e++) {
        var entity = all[e];
        if (!entity.name) continue;

        entities[entity.id] = entity.name.toLowerCase().replace(/ /g, '-');
    }
    return entities;
};