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

    var cListData = require('./downloader/custlist-data')(casper, init),
        cRecData = require('./downloader/custrecord-data')(casper, init),
        cRecMeta = require('./downloader/custrecord-metadata')(casper, init);

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
                {name: 'Load Lists', fn: require('./loader/load-lists')(casper, init)},
                {name: 'Load Records', fn: require('./loader/load-records')(casper, init)},
                //{name: 'Load Entity Fields', fn: loadEntityFields},
                {name: 'Verify downloads', fn: verifyDownloads},
                {name: 'Download Metadatas', fn: cRecMeta.manager},
                {name: 'Download Data from Lists', fn: cListData.manager},
                {name: 'Download Data from Records', fn: cRecData.manager}
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