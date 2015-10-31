'use strict';
var store = require('../store'),
    fs = require('fs'),
    $ = require('../../node_modules/jquery/dist/jquery');

var DEFAULT_FIELDS = [{
    code: 'isinactive',
    id: 0,
    translations: {en: {label: 'Is Inactive'}},
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

    var preMetadata = function(recType, metadata) {
        var $$recType = '$$' + recType,
            $$metadata = $Metadatas[$$recType];
        if ($$metadata && $$metadata.fields) {
            for (var m=0; m<$$metadata.fields.length; m++) {
                var field = $$metadata.fields[m];
                if (!metadata.fields) metadata.fields = [];
                metadata.fields.push(field);
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
        preMetadata(recType, metaObj);
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
                id: parseInt(recId),
                translations: {en: ''}
            },
            xmlURL = opt.url + '/app/common/custom/custrecord.nl?id=' + recId + '&e=T&xml=T';

        // default Entities
        if (metaObj.id < 0) {
            return saveEntityMetadata(recId, recType);
        }
        if (!recType) {
            return;
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

            metaObj.inactive = $html.find('isinactive').text() === 'T';
            metaObj.description = $html.find('description').text();
            metaObj.disclaimer = $html.find('disclaimer').text();

            // ##########################
            // Translations
            // ##########################
            var translations = $html.find('machine[name=translations] line');
            translations.each(function () {
                var $translate = $(this);
                if (!$translate.find('name').length) return;

                var name = $translate.find('name').text(),
                    locale = $translate.find('locale').text();

                metaObj.translations[locale] = name;
            });
            if (!metaObj.translations.en) {
                metaObj.translations.en = $html.find('name').text();
            }

            // ##########################
            // Load fields
            // ##########################
            var fields = $html.find('machine[name=customfield] line');
            metaObj.fields = [];

            if ($html.find('includename').text() === 'T') {
                metaObj.fields.push({
                    code: 'name',
                    id: 0,
                    translations: {en: {label: 'Name'}},
                    mandatory: true
                });
            }
            for (var f = 0; f < DEFAULT_FIELDS.length; f++) {
                var field = JSON.parse(JSON.stringify(DEFAULT_FIELDS[f]));
                metaObj.fields.push(field);
            }

            var queueFields = [],
                dataFields = [];
            fields.each(function () {
                var $field = $(this),
                    metaFieldObj = {
                        code: $field.find('fieldcustcodeid').text(),
                        id: parseInt($field.find('fieldid').text()),
                        translations: {en: {}}
                    };

                queueFields.push({
                    url: opt.url,
                    obj: metaObj,
                    field: metaFieldObj,
                    dataFields: dataFields
                });

                metaObj.fields.push(metaFieldObj);
            });

            // ##########################
            // Load tabs
            // ##########################
            var tabs = $html.find('machine[name=tabs] line');
            if (tabs.length) {
                metaObj.tabs = [];

                tabs.each(function() {
                    var $tab = $(this),
                        code = $tab.find('tabid').text(),
                        label = $tab.find('tabtitle').text(),
                        translations = $tab.find('*').filter(function() {
                            return /^tabtitle_/i.test(this.nodeName);
                        });

                    var metaTabObj = {
                        code: code,
                        translations: {
                            en: label
                        }
                    };
                    var mapTrans = {};
                    translations.each(function() {
                        var locale = this.nodeName.substring(9),
                            label = this.textContent;

                        if (!mapTrans[locale]) {
                            if (~locale.indexOf('_')) {
                                var ssll = locale.split('_');
                                mapTrans[locale] = ssll[0].toLocaleLowerCase() + '_' + ssll[1].toUpperCase();
                            } else {
                                mapTrans[locale] = locale.toLocaleLowerCase();
                            }
                        }
                        locale = mapTrans[locale];

                        metaTabObj.translations[locale] = label;
                    });

                    metaObj.tabs.push(metaTabObj);
                });
            }

            // ##########################
            // Load children
            // ##########################
            var children = $html.find('machine[name=children] line');
            if (children.length) {
                metaObj.children = [];

                children.each(function() {
                    var $child = $(this),
                        id = $child.find('childid').text(),
                        code = $RecordIds[id],
                        tab = $child.find('childtab').text();

                    dataFields.push(id);

                    var metaChildObj = {
                        code: code,
                        id: parseInt(id),
                        tab: tab
                    };

                    metaObj.children.push(metaChildObj);
                });
            }

            // ##########################
            // Load SubLists
            // ##########################
            //var subLists = $html.find('machine[name=recordsublists] line');
            //if (subLists.length) {
            //    console.log('######>>>>>> sublists', metaObj.id, metaObj.code);
            //}

            // ##########################
            // Resolve Fields URLS
            // ##########################
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
                preMetadata(recType, metaObj);
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

            fieldMeta.getFieldMetadata(metaFieldObj, opt.dataFields);
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
                    if (recType !== undefined && recType !== null) {
                        saveEntityMetadata(recId, recType);
                    }
                }
            }
            $cust.start();
        }
    };
    return $cust;
};