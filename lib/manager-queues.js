'use strict';
var store = require('./store'),
    $ = require('../node_modules/jquery/dist/jquery');

//var DATAS = {
//    invoice: '/app/accounting/transactions/custinvc.nl',
//    customrecord: '/app/common/custom/custrecordentry.nl'
//};

var $entity = require('./entity-metadata');
module.exports = function(casper, params) {
    var entityNames = $entity.getEntityNames(),
        init = {
            $EntityMetas: $entity.getEntities(),
            $EntityFields: {},
            $RecordIds: JSON.parse(JSON.stringify(entityNames)),
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
        loadEntityFields = require('./loader/load-entity-fields')(casper, init);

    var cListData = require('./downloader/custlist-data')(casper, init),
        cRecordData = require('./downloader/custrecord-data')(casper, init),
        cRecordMeta = require('./downloader/custrecord-metadata')(casper, init),
        cEntityMeta = require('./downloader/custentity-metadata')(casper, init);

    return {
        loadAll: function (opt) {
            function verifyDownloads() {
                var downloads = params.downloads;
                if (downloads && downloads.length) {
                    for (var d = 0; d < downloads.length; d++) {
                        var data = downloads[d];
                        init.download.metadatas.push(init.$RecordTypes[data.record]);
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
                {name: 'Verify downloads', fn: verifyDownloads},
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