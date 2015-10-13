'use strict';
var store = require('./store'),
    $ = require('../node_modules/jquery/dist/jquery.js');

//var DATAS = {
//    invoice: '/app/accounting/transactions/custinvc.nl',
//    customrecord: '/app/common/custom/custrecordentry.nl'
//};

var $entity = require('./entity-metadata');
module.exports = function(casper) {
    var entities = $entity.getEntities(),
        LISTS = [],
        RECORDS = JSON.parse(JSON.stringify(entities));

    var cListData = require('./custlist-data')(casper, {RECORDS: RECORDS}),
        cRecData = require('./custrecord-data')(casper, {RECORDS: RECORDS}),
        cRecMeta = require('./custrecord-metadata')(casper, {RECORDS: RECORDS});

    var ssDir = store.ssDir;

    return {
        loadAll: function (opt) {
            function loadLists(cb) {
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

                        RECORDS[recId] = recType;
                        LISTS.push(recId);
                    }
                });
            }

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

                        RECORDS[recId] = recType;
                    }

                    cRecMeta.addQueue({url: opt.url, recId: '383'});
                    cRecMeta.addQueue({url: opt.url, recId: '449'});
                    //Object.keys(RECORDS).forEach(function(recId) {
                    //    var id = parseInt(recId);
                    //    if (id > 0) {
                    //        cRecMeta.addQueue({url: opt.url, recId: recId});
                    //    }
                    //});
                    cRecMeta.start();
                });
            }

            function downloadLists() {
                cListData.addQueue({url: opt.url, recId: '161'});
                cListData.addQueue({url: opt.url, recId: '163'});
                //LISTS.forEach(function(recId) {
                //    cListData.addQueue({url: opt.url, recId: recId});
                //});
                cListData.start();
            }

            var seq = [
                {name: 'Load Lists', fn: loadLists},
                {name: 'Load Records and Get Metadata', fn: loadRecords},
                {name: 'Download Lists', fn: downloadLists}
            ];
            casper.eachThen(seq, function(res) {
                var data = res.data;
                console.log('################################');
                console.log(data.name);
                console.log('################################');

                data.fn && data.fn();
            });
        },
        download: function(opt) {
            casper.open(opt.url + '/app/center/card.nl').then(function() {
                this.capture(ssDir + '/card-center.jpg');

                var downloads = opt.downloads;
                for (var d=0; d<downloads.length; d++) {
                    var data = downloads[d];
                    cRecData.addQueue({record: data.record, id: data.id});
                }
                cRecData.start();
            });
        }
    };
};