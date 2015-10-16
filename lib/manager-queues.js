'use strict';

var $entity = require('./entity-metadata');
module.exports = function(casper, config, dir) {
    var entityIds = $entity.getEntityIds(),
        entityNames = $entity.getEntityNames(),
        init = {
            $DefaultMetas: $entity.getEntities({dir: dir}),
            $EntityFields: {},
            $TransactioFields: {},
            $RecordIds: JSON.parse(JSON.stringify(entityIds)),
            $RecordTypes: {},
            $Metadatas: {},
            $ListIds: [],
            download: {
                metadatas: [],
                records: [],
                lists: []
            }
        };

    var loadLists = require('./loader/load-lists')(casper, init),
        loadRecords = require('./loader/load-records')(casper, init),
        loadEntityFields = require('./loader/load-entity-fields')(casper, init),
        loadBodyTransactions = require('./loader/load-body-transactions')(casper, init);

    var cListData = require('./downloader/custlist-data')(casper, init),
        cRecordData = require('./downloader/custrecord-data')(casper, init),
        cBodyMeta = require('./downloader/custbody-metadata')(casper, init),
        cRecordMeta = require('./downloader/custrecord-metadata')(casper, init),
        cEntityMeta = require('./downloader/custentity-metadata')(casper, init);

    return {
        loadAll: function (opt) {
            function verifyDownloads() {
                var downloads = config.downloads;
                if (downloads && downloads.length) {
                    for (var d = 0; d < downloads.length; d++) {
                        var data = downloads[d],
                            recType = data.record,
                            recId = init.$RecordTypes[recType];
                        if (!~recType.indexOf('cust')) {
                            recId = entityNames[recType];
                            if (!recId) {
                                recType = 'transaction';
                                recId = entityNames[recType];
                                casper.log('Record "' + recType + '" is a transaction [' + recId + ']', 'warning');
                            }
                        }

                        init.download.metadatas.push(recId);
                        init.download.records.push({
                            record: recType,
                            id: data.id
                        });
                    }
                } else {
                    init.download.metadatas = Object.keys(init.$RecordIds);
                }
                console.log('Total Downloads: ' + init.download.metadatas.length);
            }

            var seq = [
                {name: 'Load Lists', fn: loadLists},
                {name: 'Load Records', fn: loadRecords},
                {name: 'Load Entity Fields', fn: loadEntityFields},
                {name: 'Load Body Transactions', fn: loadBodyTransactions},
                {name: 'Verify downloads', fn: verifyDownloads},
                {name: 'Download Body Transaction Metadatas', fn: cBodyMeta.manager},
                {name: 'Download Metadatas', fn: cRecordMeta.manager},
                {name: 'Donwload Entity Fields Metadata', fn: cEntityMeta.manager},
                {name: 'Download Data from Lists', fn: cListData.manager},
                {name: 'Download Data from Records', fn: cRecordData.manager}
            ];
            casper.eachThen(seq, function(res) {
                var data = res.data;
                console.log('################################');
                console.log(data.name);
                console.log('################################');

                data.fn && data.fn(opt);
            });
        }
    };
};