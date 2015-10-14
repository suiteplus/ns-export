'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

module.exports = function(casper, init) {
    var $EntityMetas = init.$EntityMetas,
        $EntityFields = init.$EntityFields,
        $Metadatas = init.$Metadatas,
        $RecordIds = init.$RecordIds;

    var metaDir = store.metaDir;

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
            metaObj = $Metadatas[entity],
            metaFile = metaDir + '/metadata-' + entity + '.json';

        console.log('downloading Entity Fields for Record "' + entity + '"');
        casper.eachThen(entityIds, function(res) {
            var entityId = res.data,
                entityCode =  entityFields[entityId],
                xmlURL = opt.url + '/app/common/custom/entitycustfield.nl?id=' + entityId + '&e=T&xml=T',
                metaFieldObj = {
                    code: entityCode,
                    label: entityCode,
                    id: parseInt(entityId)
                };

            if (cacheEntityFields[entityCode]) {
                var cacheMetaFieldObj = JSON.parse(JSON.stringify(cacheEntityFields[entityCode]));
                metaObj.fields.push(cacheMetaFieldObj);
            } else casper.open(xmlURL).then(function () {
                var html = this.getHTML().toString(),
                    $html = $(html);

                metaObj.fields.push(metaFieldObj);

                metaFieldObj.label = $html.find('label').text();
                metaFieldObj.type = $html.find('fieldtype').text();
                metaFieldObj.mandatory = $html.find('ismandatory').text() === 'T';
                if ($html.find('isinactive').text() === 'T') {
                    metaFieldObj.inactive = true;
                }
                if ($html.find('isformula').text() === 'T') {
                    metaFieldObj.isFormula = true;
                    metaFieldObj.default = $html.find('defaultvalue').text();
                }

                if (metaFieldObj.type === 'SELECT') {
                    var recIdRef = $html.find('fldcurselrectype');
                    if (recIdRef && recIdRef.length) {
                        metaFieldObj.recordType = $RecordIds[recIdRef.text()];
                        if (!metaFieldObj.recordType) {
                            metaFieldObj.recordType = parseInt(recIdRef.text());
                            console.log('----> NOT FOUND', entityId, '"' + recIdRef.text() + '"', metaFieldObj.type);
                        }
                    } else {
                        console.log('----->>> NO SELECT', entityId, metaFieldObj.type);
                    }

                    if (metaFieldObj.recordType && $html.find('isparent').text() === 'T') {
                        var pType = metaFieldObj.recordType,
                        // clone this column
                            pField = JSON.parse(JSON.stringify(metaFieldObj));
                        pField.recordType = $RecordIds[metaObj.id];
                        pField.parentRef = true;


                        if (!$Metadatas[pType].fields) $Metadatas[pType].fields = [];
                        $Metadatas[pType].fields.push(pField);
                        // re-save
                        var pMetaFile = metaDir + '/metadata-' + pType + '.json';
                        store.reSaveJSON(pMetaFile, $Metadatas[pType]);
                        console.log('re-saved Record Type "' + pType + '" in "' + pMetaFile + '"');

                        metaFieldObj.parent = true;
                    }
                }

                var source = $html.find('sourcefrom');
                if (source && source.length) {
                    metaFieldObj.source = {
                        column: source.text().toLowerCase(),
                        join: $html.find('sourcelist').text().toLowerCase(),
                        recordType: $RecordIds[$html.find('sourcelistrecordtype').text()]
                    };
                }

                // save cache
                cacheEntityFields[entityCode] = JSON.parse(JSON.stringify(metaFieldObj));
            });
        });
        casper.then(function() {
            store.reSaveJSON(metaFile, metaObj);
            console.log('saved Entity Fields for Record "' + entity + '" in "' + metaFile + '"');
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
            var ids = Object.keys($EntityMetas);
            for (var i=0; i<ids.length; i++) {
                var id = ids[i],
                    entityMeta = $EntityMetas[id],
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