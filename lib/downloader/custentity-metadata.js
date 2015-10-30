'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

var FieldMetadata = require('../utils/field-metadata');

module.exports = function(casper, init) {
    var $DefaultMetas = init.$DefaultMetas,
        $EntityFields = init.$EntityFields,
        $Metadatas = init.$Metadatas,
        $RecordIds = init.$RecordIds;

    var queueEntities = [],
        cacheEntityFields = {};
    var findEntityFieldMetadata = function (opt) {
        var entity = opt.entity,
            entityFields = $EntityFields[entity];
        if (!entityFields) {
            //casper.log('Entity Fields not found for Record "'+entity+'"', 'warning');
            return;
        }
        var entityIds = Object.keys(entityFields),
            metaObj = $Metadatas[entity];

        console.log('downloading Entity Fields for Record "' + entity + '"');
        casper.eachThen(entityIds, function(res) {
            var entityId = res.data,
                entityCode =  entityFields[entityId],
                xmlURL = opt.url + '/app/common/custom/entitycustfield.nl?id=' + entityId + '&e=T&xml=T',
                metaFieldObj = {
                    code: entityCode,
                    id: parseInt(entityId),
                    translations: {en: {}}
                };

            if (cacheEntityFields[entityCode]) {
                var cacheMetaFieldObj = JSON.parse(JSON.stringify(cacheEntityFields[entityCode]));
                metaObj.fields.push(cacheMetaFieldObj);
            } else casper.open(xmlURL).then(function () {
                var html = this.getHTML().toString(),
                    $html = $(html),
                    fieldMeta = new FieldMetadata($html, metaObj, init);

                fieldMeta.getFieldMetadata(metaFieldObj);
                metaObj.fields.push(metaFieldObj);

                // save cache
                cacheEntityFields[entityCode] = JSON.parse(JSON.stringify(metaFieldObj));
            });
        });
        casper.then(function() {
            store.saveMetadata(metaObj);
        });
    };


    var $cust = {
        addQueue: function (opt) {
            queueEntities.push(opt);
        },
        start: function () {
            casper.eachThen(queueEntities, function (res) {
                var opt = res.data;
                findEntityFieldMetadata(opt);
            });
        },
        manager: function (opt) {
            var ids = Object.keys($DefaultMetas);
            for (var i=0; i<ids.length; i++) {
                var id = ids[i],
                    entityMeta = $DefaultMetas[id],
                    code = entityMeta.code;
                if ($Metadatas[code]) {
                    $cust.addQueue({
                        url: opt.url,
                        entity: code
                    })
                }
            }
            $cust.start();
        }
    };
    return $cust;
};