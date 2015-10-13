'use strict';
var store = require('./store'),
    $ = require('../node_modules/jquery/dist/jquery.js');

module.exports = function(casper, opt) {
    var RECORDS = opt.RECORDS;

    var metaDir = store.metaDir;

    var queueRecords = [];
    var findRecord = function (opt) {
        var recId = opt.recId,
            recType = RECORDS[recId],
            metaFile = metaDir + '/' + (recType || recId) + '.json',
            metaObj = {code: recType, id: parseInt(recId)},
            xmlURL = opt.url + '/app/common/custom/custrecord.nl?id=' + recId + '&e=T&xml=T';
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

            var queueFields = [];
            fields.each(function() {
                var $field = $(this),
                    metaFieldObj = {};

                metaFieldObj.code = $field.find('fieldcustcodeid').text();
                metaFieldObj.id = parseInt($field.find('fieldid').text());
                //metaFieldObj.desc = $field.find('fielddescr').text();

                queueFields.push({url: opt.url, recId: recId, field: metaFieldObj});

                metaObj.fields.push(metaFieldObj);
            });

            casper.eachThen(queueFields, function(res) {
                var opt = res.data;
                resolveFieldRef(opt);
            });
            casper.then(function() {
                store.saveJSON(metaFile, metaObj);
                console.log('saved Record Type "' + recType + '" in ', metaFile);
            });
        });
    };

    var resolveFieldRef = function(opt) {
        var recId = opt.recId,
            fieldId = parseInt(opt.field.id),
            metaFieldObj = opt.field,
            xmlURL = opt.url + '/app/common/custom/custreccustfield.nl?rectype=' + recId + '&e=T&id=' + fieldId + '&xml=T';

        casper.open(xmlURL).then(function () {
            var html = this.getHTML().toString(),
                $html = $(html);

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
                    metaFieldObj.recordType = RECORDS[recIdRef.text()];
                    if (!metaFieldObj.recordType) {
                        metaFieldObj.recordType = parseInt(recIdRef.text());
                        console.log('----> NOT FOUND', fieldId, '"' + recIdRef.text() + '"', metaFieldObj.type);
                    }
                } else {
                    console.log('----->>> NO SELECT', fieldId, metaFieldObj.type);
                }
            }

            var source = $html.find('sourcefrom');
            if (source && source.length) {
                metaFieldObj.source = {
                    column: source.text().toLowerCase(),
                    join: $html.find('sourcelist').text().toLowerCase(),
                    recordType: RECORDS[$html.find('sourcelistrecordtype').text()]
                };
            }
        });
    };

    return {
        addQueue: function(opt) {
            queueRecords.push(opt);
        },
        start: function() {
            casper.eachThen(queueRecords, function(res) {
                var opt = res.data;
                findRecord(opt);
            });
        }
    };
};

