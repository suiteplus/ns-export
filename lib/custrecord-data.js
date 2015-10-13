'use strict';
var store = require('./store');

module.exports = function(casper, opt) {
    var RECORDS = opt.RECORDS;

    var dataDir = store.dataDir;

    var queueListEmpty = true,
        queueLists = [];
    var donwloadRecord = function (opt) {
        if (queueListEmpty) {
            queueListEmpty = false;

            // test NetSuite SuiteScript API
            casper.evaluateOrDie(function() {
                return !!nlapiLoadRecord;
            }, 'NetSuite API not found');
            // TODO load record metadata for get relationship information

            // then ... Load Record
            var record = casper.evaluate(function(type, id) {
                var record = nlapiLoadRecord(type, id),
                    fields = record.getAllFields(),
                    data = {};
                for (var i=0; i<fields.length; i++) {
                    var field = fields[i];
                    data[field] = record.getFieldValue(field);
                }
                return data;
            }, opt.record, opt.id);

            // TODO download all others records ... relationship

            // FIXME validate columns metadata
            var dataFile = dataDir + '/' + opt.record + '.json';
            store.saveJSON(dataFile, record);

        } else {
            queueLists.push({opt: opt});
        }
    };

    return {addQueue: donwloadRecord};
};