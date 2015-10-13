'use strict';
var store = require('./store'),
    $ = require('../node_modules/jquery/dist/jquery.js');

//var DATAS = {
//    invoice: '/app/accounting/transactions/custinvc.nl',
//    customrecord: '/app/common/custom/custrecordentry.nl'
//};

var $entity = require('./entity-metadata');
module.exports = function(casper, params) {
    var downloadMetas = [],
        downloadRecords = [],
        downloadLists = [];

    var entities = $entity.getEntities(),
        $ListIds = [],
        $RecordIds = JSON.parse(JSON.stringify(entities)),
        $Metadatas = {},
        init = {
            $RecordIds: $RecordIds,
            $Metadatas: $Metadatas,
            records: downloadRecords,
            lists: downloadLists
        };

    var cListData = require('./custlist-data')(casper, init),
        cRecData = require('./custrecord-data')(casper, init),
        cRecMeta = require('./custrecord-metadata')(casper, init);

    var ssDir = store.ssDir;

    return {
        loadAll: function (opt) {
            function loadLists() {
                // load lists
                casper.open(opt.url + '/app/common/custom/custlists.nl').then(function () {
                    this.capture(ssDir + '/custom-lists.jpg');
                    var html = this.getHTML().toString(),
                        $html = $(html),
                        rows = $html.find('tr.uir-list-row-tr');

                    for (var r = 0; r < rows.length; r++) {
                        var row = $(rows[r]),
                            recType = row.find('td:nth-child(3)').text().trim(),
                            recId = row.find('td:nth-child(4)').text().trim();

                        $RecordIds[recId] = recType;
                        $ListIds.push(recId);
                    }
                    console.log('Total Lists: ' + rows.length);
                });
            }

            var $RecordTypes = {};
            function loadRecords() {
                // load records types
                casper.open(opt.url + '/app/common/custom/custrecords.nl').then(function () {
                    this.capture(ssDir + '/custom-records.jpg');
                    var html = this.getHTML().toString(),
                        $html = $(html),
                        rows = $html.find('tr.uir-list-row-tr');

                    for (var r = 0; r < rows.length; r++) {
                        var row = $(rows[r]),
                            recType = row.find('td:nth-child(3)').text().trim(),
                            recId = row.find('td:nth-child(4)').text().trim();

                        $RecordIds[recId] = recType;
                    }
                    Object.keys($RecordIds).forEach(function (recId) {
                        var recType = $RecordIds[recId];
                        $RecordTypes[recType] = recId;
                    });

                    console.log('Total Records: ' + rows.length);
                });
            }

            function verifyDownloads() {
                var downloads = params.downloads;
                if (downloads && downloads.length) {
                    for (var d = 0; d < downloads.length; d++) {
                        var data = downloads[d];
                        downloadMetas.push($RecordTypes[data.record]);
                    }
                } else {
                    downloadMetas = Object.keys($RecordIds);
                }
                console.log('Total Downloads: ' + downloadMetas.length);
            }

            function downloadMetadata() {
                if (!downloadMetas) return;
                for (var d = 0; d < downloadMetas.length; d++) {
                    var recId = downloadMetas[d],
                        id = parseInt(recId);
                    if (id > 0) {
                        cRecMeta.addQueue({
                            url: opt.url,
                            recId: recId
                        });
                    }
                }
                cRecMeta.start();
            }

            function downloadListData() {
                for (var d = 0; d < downloadLists.length; d++) {
                    var recId = downloadLists[d];
                    cListData.addQueue({url: opt.url, recId: recId});
                }
                cListData.start();
            }

            function downloadRecordData() {
                casper.open(opt.url + '/app/center/card.nl').then(function () {
                    this.capture(ssDir + '/card-center.jpg');

                    var downloads = params.downloads;
                    if (downloads && downloads.length) {
                        for (var d = 0; d < downloads.length; d++) {
                            var data = downloads[d];
                            cRecData.addQueue({record: data.record, id: data.id});
                        }
                        cRecData.start();
                    }
                });
            }

            var seq = [
                {name: 'Load Lists', fn: loadLists},
                {name: 'Load Records', fn: loadRecords},
                {name: 'Verify downloads', fn: verifyDownloads},
                {name: 'Download Metadatas', fn: downloadMetadata},
                {name: 'Download Data from Lists', fn: downloadListData},
                {name: 'Download Data from Records', fn: downloadRecordData}
            ];
            casper.eachThen(seq, function(res) {
                var data = res.data;
                console.log('################################');
                console.log(data.name);
                console.log('################################');

                data.fn && data.fn();
            });
        },

    };
};