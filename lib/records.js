'use strict';
var fs = require('fs'),
    $ = require('../node_modules/jquery/dist/jquery.js');


module.exports = function(casper) {
    var RECORDS = {};

    var tempDir = '.ns-exports',
        ssDir = tempDir + '/ss',
        metaDir = tempDir + '/meta';


    var queueRecordEmpty = true,
        queueRecords = [];
    var findRecord = function (opt) {
        if (queueRecordEmpty) {
            queueRecordEmpty = false;

            var recId = opt.recId,
                recType = RECORDS[recId],
                metaFile = metaDir + '/' + recType + '.json',
                metaObj = {code: recType, id: recId},
                xmlURL = opt.url + '/app/common/custom/custrecord.nl?id=' + recId + '&e=T&xml=T';
            console.log('downloading Record Type "', recType, '');
            casper.open(xmlURL).then(function() {
                var html = this.getHTML().toString(),
                    $html = $(html);

                metaObj.name = $html.find('recordname').text();
                metaObj.inactive = $html.find('isinactive').text() === 'T';

                var fields = $html.find('machine[name=customfield] line');
                metaObj.fields = [];

                var actual = 0,
                    verifyEnd = function() {
                        if (++actual === (fields.length+1)) {
                            fs.write(metaFile, JSON.stringify(metaObj, null, '   '), 'w');
                            console.log('saved Record Type "', recType, '" in ', metaFile);

                            // execute next findRecord
                            var queue = queueRecords.shift();
                            queueRecordEmpty = true;
                            queue && findRecord(queue.opt);
                        }
                    };

                fields.each(function() {
                    var $field = $(this),
                        metaFieldObj = {};

                    metaFieldObj.code = $field.find('fieldcustcodeid').text();
                    metaFieldObj.id = $field.find('fieldid').text();
                    metaFieldObj.desc = $field.find('fielddescr').text();

                    resolveFieldRef({url: opt.url, recId: recId, field: metaFieldObj}, verifyEnd);

                    metaObj.fields.push(metaFieldObj);
                });
                verifyEnd();
            });
        } else {
            queueRecords.push({opt: opt});
        }
    };

    var queueFieldEmpty = true,
        queueFields = [];
    var resolveFieldRef = function(opt, cb) {

        if (queueFieldEmpty) {
            queueFieldEmpty = false;

            var recId = opt.recId,
                fieldId = opt.field.id,
                metaFieldObj = opt.field,
                xmlURL = opt.url + '/app/common/custom/custreccustfield.nl?rectype=' + recId + '&e=T&id='+fieldId+'&xml=T';

            casper.open(xmlURL).then(function() {
                var html = this.getHTML().toString(),
                    $html = $(html);

                metaFieldObj.type = $html.find('fieldtype').text();
                metaFieldObj.mandatory = $html.find('ismandatory').text() === 'T';
                metaFieldObj.inactive = $html.find('isinactive').text() === 'T';
                metaFieldObj.isFormula = $html.find('isformula').text() === 'T';

                var recIdRef = $html.find('fldcurselrectype');
                if (recIdRef && recIdRef.length) {
                    metaFieldObj.ref = RECORDS[recIdRef.text()];
                }

                // execute next resolveFieldRef
                var queue = queueFields.shift();
                queueFieldEmpty = true;
                queue && resolveFieldRef(queue.opt, queue.cb);

                cb && cb();
            });
        } else {
            queueFields.push({opt: opt, cb: cb});
        }
    };

    return {
        loadAll: function (baseURL) {
            // load records type list
            casper.open(baseURL + '/app/common/custom/custrecords.nl').then(function () {
                this.capture(ssDir + '/record-list.jpg');
                var html = this.getHTML().toString(),
                    $html = $(html),
                    rows = $html.find('tr.uir-list-row-tr');

                for (var r = 0; r < rows.length; r++) {
                    var row = $(rows[r]),
                        recType = row.find('td:nth-child(3)').text().trim(),
                        recId = row.find('td:nth-child(4)').text().trim();

                    RECORDS[recId] = recType;
                }

                Object.keys(RECORDS).forEach(function(recId) {
                    findRecord({url: baseURL, recId: recId});
                });
            });
        }
    };
};

