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

module.exports = function(casper, init) {
    var $EntityMetas = init.$EntityMetas,
        $RecordIds = init.$RecordIds,
        $Metadatas = init.$Metadatas,
        $records = init.download.records,
        $lists = init.download.lists;

    var metaDir = store.metaDir;

    var MetaParents = {};

    var queueRecords = [];
    var findMetadata = function (opt) {
        var deep = opt.deep;
        if (deep <= 0) return;
        var recId = opt.recId,
            recType = $RecordIds[recId],
            metaFile = metaDir + '/metadata-' + (recType || recId) + '.json',
            metaObj = {
                code: recType,
                name: '',
                id: parseInt(recId)
            },
            xmlURL = opt.url + '/app/common/custom/custrecord.nl?id=' + recId + '&e=T&xml=T';

        // default Entities
        if (metaObj.id < 0) {
            metaObj = $EntityMetas[recId];
            if (MetaParents[recType]) {
                MetaParents[recType].forEach(function (pField) {
                    metaObj.fields.push(pField);
                });
                delete MetaParents[recType];

                if (fs.exists(metaFile)) {
                    store.reSaveJSON(metaFile, metaObj);
                    console.log('re-saved Record Type "' + recType + '" in "' + metaFile + '"');
                }
            }
            if (!fs.exists(metaFile)) {
                store.saveJSON(metaFile, metaObj);
                console.log('saved Record Type "' + recType + '" in "' + metaFile + '"');
            }
            return  $Metadatas[recType] = metaObj;
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
                    recId: recId,
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

                store.saveJSON(metaFile, metaObj);
                $Metadatas[recType] = metaObj;
                console.log('saved Record Type "' + recType + '" in "' + metaFile + '"');

                casper.eachThen(dataFields, function (res) {
                    var recId = res.data;
                    findMetadata({url: opt.url, recId: recId, deep: (deep-1)});
                });
            });
        });
    };

    var resolveFieldRef = function (opt) {
        var recId = opt.recId,
            fieldId = parseInt(opt.field.id),
            metaFieldObj = opt.field,
            xmlURL = opt.url + '/app/common/custom/custreccustfield.nl?rectype=' + recId + '&e=T&id=' + fieldId + '&xml=T';

        casper.open(xmlURL).then(function () {
            var html = this.getHTML().toString(),
                $html = $(html);

            //metaFieldObj.label = $html.find('record label').text();
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
                        console.log('----> NOT FOUND', fieldId, '"' + recIdRef.text() + '"', metaFieldObj.type);
                    } else {
                        opt.dataFields.push(recIdRef.text());
                    }
                } else {
                    console.log('----->>> NO SELECT', fieldId, metaFieldObj.type);
                }

                if (metaFieldObj.recordType && $html.find('isparent').text() === 'T') {
                    var pType = metaFieldObj.recordType,
                    // clone this column
                        pField = JSON.parse(JSON.stringify(metaFieldObj));
                    pField.recordType = $RecordIds[recId];
                    pField.parentRef = true;

                    if ($Metadatas[pType]) {
                        if (!$Metadatas[pType].fields) $Metadatas[pType].fields = [];
                        $Metadatas[pType].fields.push(pField);
                        // re-save
                        var pMetaFile = metaDir + '/metadata-' + pType + '.json';
                        store.reSaveJSON(pMetaFile, $Metadatas[pType]);
                        console.log('re-saved Record Type "' + pType + '" in "' + pMetaFile + '"');
                    } else {
                        if (!MetaParents[pType]) MetaParents[pType] = [];
                        MetaParents[pType].push(pField);
                    }
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
                        deep: opt.params.deep || 1
                    });
                }
            }
            $cust.start();
        }
    };
    return $cust;
};