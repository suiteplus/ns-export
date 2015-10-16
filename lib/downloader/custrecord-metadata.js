'use strict';
var store = require('../store'),
    fs = require('fs'),
    $ = require('../../node_modules/jquery/dist/jquery');

var DEFAULT_FIELDS = [{
    code: 'isinactive',
    id: 0,
    desc: 'Is Inactive',
    type: 'CHECKBOX',
    mandatory: false
}];

var FieldMetadata = require('../utils/field-metadata');

module.exports = function(casper, init) {
    var $DefaultMetas = init.$DefaultMetas,
        $RecordIds = init.$RecordIds,
        $Metadatas = init.$Metadatas,
        $records = init.download.records,
        $lists = init.download.lists;

    var MetaParents = {};

    var preMetadata = function(recType) {
        var $$recType = '$$' + recType,
            metadata = $Metadatas[$$recType];
        if (metadata && metadata.fields) {
            for (var m=0; m<metadata.fields.length; m++) {
                var field = metadata.fields[m];
                $Metadatas[recType].fields.push(field);
            }
            delete $Metadatas[$$recType];
        }
    };

    var saveEntityMetadata = function(recId, recType) {
        var metaObj = $DefaultMetas[recId];
        if (MetaParents[recType]) {
            MetaParents[recType].forEach(function (pField) {
                metaObj.fields.push(pField);
            });
            delete MetaParents[recType];
        }
        preMetadata(recType);
        store.saveMetadata(metaObj);
        return $Metadatas[recType] = metaObj;
    };

    var queueRecords = [];
    var findMetadata = function (opt) {
        var depth = opt.depth;
        if (depth <= 0) return;
        var recId = opt.recId,
            recType = $RecordIds[recId],
            metaObj = {
                code: recType,
                name: '',
                id: parseInt(recId)
            },
            xmlURL = opt.url + '/app/common/custom/custrecord.nl?id=' + recId + '&e=T&xml=T';

        // default Entities
        if (metaObj.id < 0) {
            return saveEntityMetadata(recId, recType);
        }

        var tables = (~recType.indexOf('customlist_')) ? $lists : $records;
        if (~tables.indexOf(recId)) {
            return;
        } else {
            tables.push(recId);
        }

        console.log('downloading Record Type "' + recType + '"');
        casper.open(xmlURL).then(function () {
            var html = this.getHTML().toString(),
                $html = $(html);

            metaObj.name = $html.find('recordname').text();
            metaObj.inactive = $html.find('isinactive').text() === 'T';

            var fields = $html.find('machine[name=customfield] line');
            metaObj.fields = [];

            if ($html.find('includename').text() === 'T') {
                metaObj.fields.push({
                    code: 'name',
                    id: 0,
                    label: 'Name',
                    mandatory: true
                });
            }
            for (var i = 0; i < DEFAULT_FIELDS.length; i++) {
                var field = JSON.parse(JSON.stringify(DEFAULT_FIELDS[i]));
                metaObj.fields.push(field);
            }

            var queueFields = [],
                dataFields = [];
            fields.each(function () {
                var $field = $(this),
                    metaFieldObj = {
                        code: $field.find('fieldcustcodeid').text(),
                        label: $field.find('fielddescr').text(),
                        id: parseInt($field.find('fieldid').text())
                    };

                queueFields.push({
                    url: opt.url,
                    obj: metaObj,
                    field: metaFieldObj,
                    dataFields: dataFields
                });

                metaObj.fields.push(metaFieldObj);
            });

            casper.eachThen(queueFields, function (res) {
                var opt = res.data;
                resolveFieldRef(opt);
            });
            casper.then(function () {
                if (MetaParents[recType]) {
                    MetaParents[recType].forEach(function (pField) {
                        metaObj.fields.push(pField);
                    });
                    delete MetaParents[recType];
                }
                preMetadata(recType);
                store.saveMetadata(metaObj);
                $Metadatas[recType] = metaObj;

                casper.eachThen(dataFields, function (res) {
                    var recId = res.data;
                    findMetadata({url: opt.url, recId: recId, depth: (depth-1)});
                });
            });
        });
    };

    var resolveFieldRef = function (opt) {
        var metaObj = opt.obj,
            recId = metaObj.id,
            fieldId = parseInt(opt.field.id),
            metaFieldObj = opt.field,
            xmlURL = opt.url + '/app/common/custom/custreccustfield.nl?rectype=' + recId + '&e=T&id=' + fieldId + '&xml=T';

        casper.open(xmlURL).then(function () {
            var html = this.getHTML().toString(),
                $html = $(html),
                fieldMeta = new FieldMetadata($html, metaObj, init);

            fieldMeta.getFieldMetadata(metaFieldObj);
        });
    };

    var $cust = {
        addQueue: function (opt) {
            queueRecords.push(opt);
        },
        start: function () {
            casper.eachThen(queueRecords, function (res) {
                var opt = res.data;
                findMetadata(opt);
            });
        },
        manager: function (opt) {
            if (!init.download || !init.download.metadatas) return;
            var $downloadMetas = init.download.metadatas;
            for (var d = 0; d < $downloadMetas.length; d++) {
                var recId = $downloadMetas[d],
                    id = parseInt(recId);
                if (id > 0) {
                    $cust.addQueue({
                        url: opt.url,
                        recId: recId,
                        depth: opt.config.depth || 1
                    });
                } else {
                    var recType = $RecordIds[recId];
                    saveEntityMetadata(recId, recType);
                }
            }
            $cust.start();
        }
    };
    return $cust;
};