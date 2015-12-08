'use strict';
var moment = require('../../node_modules/moment/moment'),
    store = require('../store');

module.exports = function(casper, init) {
    var $Metadatas = init.$Metadatas;

    var ssDir = store.ssDir;

    var $dateformat;

    var queueRecords = [],
        dataRecords = {},
        downloadsEnd = {};
    var downloadRecord = function (opt) {
        var depth = opt.depth;
        if (depth <= 0) return;
        var recType = opt.record,
            id = opt.id;

        // already done
        if (downloadsEnd[recType + '=' + id]) return;
        else if (!recType || !id) return;
        else if (~recType.indexOf('customlist_')) return;

        // test NetSuite SuiteScript API
        casper.evaluateOrDie(function () {
            return !!nlapiLoadRecord && !!nlapiLookupField && !!nlapiCreateSearch;
        }, 'NetSuite API not found');

        if (!dataRecords[recType]) dataRecords[recType] = [];
        var dataRecord = dataRecords[recType],
            metadata = $Metadatas[recType],
            $$recType, isTransaction = false;

        // resolve Record Type "transaction"
        if (recType === 'transaction' || recType === 'entity') {
            isTransaction = true;
            $$recType = casper.evaluate(function (type, id) {
                var search = nlapiCreateSearch(type, ['internalid', 'is', id]),
                    run = search.runSearch(),
                    result = run.getResults(0,1)[0];
                return result && result.type;
            }, recType, id);
            if (!$$recType) {
                casper.log('Cannot find type of transaction ['+id+']', 'error');
                return;
            }

            // clone transaction metadata
            if (!$Metadatas[$$recType] && metadata) {
                //console.log($$recType, metadata);
                var metadata_ = JSON.parse(JSON.stringify(metadata));
                metadata_.code = $$recType;
                metadata_.name = $$recType;
                store.saveMetadata(metadata_);
                $Metadatas[$$recType] = metadata_;
            }
            if (!dataRecords[$$recType]) dataRecords[$$recType] = [];

        } else {
            $$recType = recType;
        }

        console.log('downloading Record: "' + recType + (isTransaction ? '['+$$recType+']': '') + '" = '+ id);

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
        }, $$recType, id);

        if (!record) {
            casper.log('Not found Record: "' + $$recType + '" = ' + id, 'warning');
            record = {internalid: id};
        }

        var dataFields = [],
            dataId = parseInt(record.internalid),
            data = {
                internalid: isNaN(dataId) ? record.internalid : dataId
            };
        if (!metadata) {
            casper.log('metadata not found for Record: "'+recType+'"', 'warning');
            delete record.id;
            record.internalid = isNaN(dataId) ? record.internalid : dataId;
            dataRecord.push(record);
        } else {
            if (metadata.fields) {
                metadata.fields.forEach(function(field) {
                    if (!field) return;
                    // validate columns by metadata
                    else if (record[field.code]) {
                        var key = field.code,
                            value = record[key];
                        if (~['SELECT', 'INTEGER', 'DOCUMENT', 'IMAGE'].indexOf(field.type)) {
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
            }

            if (metadata.fields && metadata.children) {
                metadata.children.forEach(function (child) {
                    var fields = metadata.fields.filter(function(field) {
                        if (field.type !== 'SELECT') {
                            return false;
                        } else {
                            return field.parentRef && field.recordType === child.code;
                        }
                    });
                    fields.forEach(function(field) {
                        if (!isNaN(parseInt(field.recordType))) return;

                        var ids = casper.evaluate(function (type, field, id) {
                            var search = nlapiSearchRecord(type, null, [field, 'anyof', id]) || [],
                                ids = [];
                            search.forEach(function(res) {
                                ids.push(res.getId());
                            });
                            return ids;
                        }, field.recordType, field.code, id);

                        if (!ids) {
                            return;
                        }

                        ids.forEach(function(id) {
                            dataFields.push({
                                record: field.recordType,
                                id: id
                            });
                        });
                    });
                });
            }
        }
        if (recType === 'transaction' || recType === 'entity') {
            var $$dataRecord = dataRecords[$$recType];
            $$dataRecord.push(dataRecord[dataRecord.length-1]);
        }

        downloadsEnd[recType + '=' + id] = true;

        casper.eachThen(dataFields, function(res) {
            var opt = res.data;
            downloadRecord({
                record: opt.record,
                id: opt.id,
                depth: (depth-1)
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

                    store.saveData(recType, dataRecord);
                }
            });
        },
        manager: function (opt) {
            if (!opt.config || !opt.config.downloads) return;

            casper.open(opt.url + '/app/center/card.nl').then(function () {
                this.capture(ssDir + '/card-center.jpg');

                var records = init.download.records;
                if (records && records.length) {
                    for (var d = 0; d < records.length; d++) {
                        var data = records[d];
                        $cust.addQueue({
                            record: data.record,
                            id: data.id,
                            depth: opt.config.depth || 1
                        });
                    }
                    $cust.start();
                }
            });
        }
    };
    return $cust;
};