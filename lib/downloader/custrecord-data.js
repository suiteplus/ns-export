'use strict';
var moment = require('../../node_modules/moment/moment'),
    store = require('../store');

module.exports = function(casper, init) {
    var $Metadatas = init.$Metadatas;

    var dataDir = store.dataDir,
        ssDir = store.ssDir;

    var $dateformat;

    var queueRecords = [],
        dataRecords = {},
        downloadsEnd = {};
    var downloadRecord = function (opt) {
        var deep = opt.deep;
        if (deep <= 0) return;
        var recType = opt.record,
            id = opt.id;

        // already done
        if (downloadsEnd[recType + '=' + id]) return;
        else if (!recType || !id) return;
        else if (~recType.indexOf('customlist_')) return;

        console.log('downloading Record: "' + recType + '" = '+ id);

        // test NetSuite SuiteScript API
        casper.evaluateOrDie(function () {
            return !!nlapiLoadRecord && !!nlapiLookupField;
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

        // TODO find parent references

        if (!record) {
            casper.log('Not found Record: "' + recType + '" = ' + id, 'warning');
            record = {internalid: id};
        }

        var dataFields = [],
            dataId = parseInt(record.internalid),
            data = {
                internalid: isNaN(dataId) ? record.internalid : dataId
            };
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
                    } else if ('DATE' === field.type) {
                        var date = moment(value, $dateformat);
                        data[key] = date.toJSON() || value;
                    } else {
                        data[key] = value;
                    }
                }
                //else if (field.parentRef) {
                //    // get parent id
                //    var value = casper.evaluate(function (type, id, field) {
                //        return nlapiLookupField(type, id, field);
                //    }, recType, data.internalid, field.code);
                //    if (value) {
                //        data[field.code] = value;
                //    } else {
                //        casper.log('Cannot get ["' + field.code + '"] from Record "' + recType + '" = ' + data.internalid, 'error');
                //    }
                //}


                // load relationships
                if (!field.code || ~field.code.indexOf('customlist_')) {
                    return;
                } else if (field.recordType && record[field.code]) {
                    var type = field.recordType,
                        id = record[field.code];
                    dataFields.push({record: type, id: id});
                }
            });

            if (metadata.id < 0) Object.keys(record).forEach(function(key) {
                if (!data[key] && key.indexOf('cust') === 0) {
                    data[key] = record[key];
                }
            });

            dataRecord.push(data);
        } else {
            casper.log('metadata not found for Record: "'+recType+'"', 'warning');
            delete record.id;
            record.internalid = isNaN(dataId) ? record.internalid : dataId;
            dataRecord.push(record);
        }

        downloadsEnd[recType + '=' + id] = true;

        casper.eachThen(dataFields, function(res) {
            var opt = res.data;
            downloadRecord({
                record: opt.record,
                id: opt.id,
                deep: (deep-1)
            });
        });
    };


    var $cust = {
        addQueue: function(opt) {
            queueRecords.push(opt);
        },
        start: function() {
            // get Account Configuration
            $dateformat = casper.evaluate(function () {
                return window.dateformat;
            });

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
                    console.log('saved Record "' + recType + '" in "'+ dataFile+ '" ( total:', dataRecord.length, ')');
                }
            });
        },
        manager: function (opt) {
            if (!opt.params || !opt.params.downloads) return;

            casper.open(opt.url + '/app/center/card.nl').then(function () {
                this.capture(ssDir + '/card-center.jpg');

                var downloads = opt.params.downloads;
                if (downloads && downloads.length) {
                    for (var d = 0; d < downloads.length; d++) {
                        var data = downloads[d];
                        $cust.addQueue({
                            record: data.record,
                            id: data.id,
                            deep: opt.params.deep || 1
                        });
                    }
                    $cust.start();
                }
            });
        }
    };
    return $cust;
};