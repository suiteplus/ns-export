'use strict';
var store = require('./store'),
    $ = require('../node_modules/jquery/dist/jquery.js');

//var DATAS = {
//    invoice: '/app/accounting/transactions/custinvc.nl',
//    customrecord: '/app/common/custom/custrecordentry.nl'
//};

module.exports = function(casper) {
    var LISTS = [],
        RECORDS = {};

    var clistData = require('./custlist-data')(casper, {RECORDS: RECORDS}),
        crecMeta = require('./custrecord-metadata')(casper, {RECORDS: RECORDS});

    var ssDir = store.ssDir;

    return {
        loadAll: function (baseURL) {
            function loadLists(cb) {
                // load lists
                casper.open(baseURL + '/app/common/custom/custlists.nl').then(function () {
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
                casper.open(baseURL + '/app/common/custom/custrecords.nl').then(function () {
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

                    //crecMeta.addQueue({url: baseURL, recId: '383'});
                    //crecMeta.addQueue({url: baseURL, recId: '449'});
                    Object.keys(RECORDS).forEach(function(recId) {
                        crecMeta.addQueue({url: baseURL, recId: recId});
                    });
                });
            }

            function downloadLists() {
                //clistData.addQueue({url: baseURL, recId: '420'});
                LISTS.forEach(function(recId) {
                    clistData.addQueue({url: baseURL, recId: recId});
                });
            }

            var seq = [
                {name: 'Load Lists', fn: loadLists},
                {name: 'Load Records and Get Metadata', fn: loadRecords},
                {name: 'Download Lists', fn: downloadLists}
            ];
            casper.eachThen(seq, function(res) {
                var data = res.data;
                console.log('######################');
                console.log(data.name);
                console.log('######################');

                data.fn && data.fn();
            });
        }
    };
};