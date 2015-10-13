'use strict';
var store = require('./store');

module.exports = function(casper, init) {
    var $Metadatas = init.$Metadatas;

    var dataDir = store.dataDir;

    var queueRecords = [],
        dataRecords = {},
        downloadsEnd = {};
    var downloadRecord = function (opt) {
        var recType = opt.record,
            id = opt.id;

        // already done
        if (downloadsEnd[recType + '=' + id]) return;
        else if (!recType || !id) return;
        else if (~recType.indexOf('customlist_')) return;

        console.log('downloading Record: "' + recType + '" = '+ id);

        // test NetSuite SuiteScript API
        casper.evaluateOrDie(function () {
            return !!nlapiLoadRecord;
        }, 'NetSuite API not found');

        if (!dataRecords[recType]) dataRecords[recType] = [];

        var dataRecord = dataRecords[recType],
            metadata = $Metadatas[recType];

        // then ... Load Record
        var record = casper.evaluate(function (type, id) {
            var record = nlapiLoadRecord(type, id),
                fields = record.getAllFields(),
                data = {};
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                data[field] = record.getFieldValue(field);
            }
            data.internalid = record.getId();
            return data;
        }, recType, id);

        if (!record) {
            console.log('Not found Record: "' + recType + '" = ' + id);
            return;
        }

        var dataFields = [], data = {};
        if (metadata && metadata.fields) {
            metadata.fields.forEach(function(field) {
                if (!field) return;
                // validate columns by metadata
                else if (record[field.code]) {
                    var key = field.code,
                        value = record[key];
                    if (~['SELECT', 'INTEGER'].indexOf(field.type)) {
                        data[key] = parseInt(value);
                    } else if (~['CURRENCY'].indexOf(field.type)) {
                        data[key] = parseFloat(value);
                    } else {
                        data[key] = value;
                    }
                }
                // load relationships
                if (!field.code || ~field.code.indexOf('customlist_')) {
                    return;
                } else if (field.recordType && record[field.code]) {
                    var type = field.recordType,
                        id = record[field.code];
                    dataFields.push({record: type, id: id});
                }
            });
            data.internalid = record.internalid;

            dataRecord.push(data);
        } else {
            casper.log('metadata not found for Record: "'+recType+'"', 'warning');
            dataRecord.push(record);
        }

        downloadsEnd[recType + '=' + id] = true;

        casper.eachThen(dataFields, function(res) {
            var opt = res.data;
            downloadRecord(opt);
        });
    };


    return {
        addQueue: function(opt) {
            queueRecords.push(opt);
        },
        start: function() {
            casper.eachThen(queueRecords, function(res) {
                var opt = res.data;
                downloadRecord(opt);
            });
            // save data records
            casper.then(function() {
                var recTypes = Object.keys(dataRecords);
                for (var k=0; k<recTypes.length; k++) {
                    var recType = recTypes[k],
                        dataRecord = dataRecords[recType];

                    var dataFile = dataDir + '/' + recType + '.json';
                    store.saveJSON(dataFile, dataRecord);
                    console.log('saved Record "' + recType + '" in "'+ dataFile+ '" (total:', dataRecord.length, ')');
                }
            });
        }
    };
};