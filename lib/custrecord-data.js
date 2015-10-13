'use strict';
var store = require('./store');

module.exports = function(casper, opt) {
    var RECORDS = opt.RECORDS;

    var dataDir = store.dataDir;

    var queueRecords = [],
        dataRecords = {};
    var downloadRecord = function (opt) {
        console.log('################################################################');
        console.log('download data from Record Type: "' + opt.record + '"');
        console.log('################################################################');

        // test NetSuite SuiteScript API
        casper.evaluateOrDie(function () {
            return !!nlapiLoadRecord;
        }, 'NetSuite API not found');

        if (!dataRecords[opt.record]) dataRecords[opt.record] = [];

        var dataRecord = dataRecords[opt.record];
        // TODO load record metadata for get relationship information

        // then ... Load Record
        var record = casper.evaluate(function (type, id) {
            var record = nlapiLoadRecord(type, id),
                fields = record.getAllFields(),
                data = {};
            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                data[field] = record.getFieldValue(field);
            }
            return data;
        }, opt.record, opt.id);

        // TODO download all others records ... relationship

        // FIXME validate columns metadata
        dataRecord.push(record);
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
                    console.log('saved Record "', recType, '" in ', dataFile, 'total:', dataRecord.length);
                }
            });
        }
    };
};