'use strict';
var store = require('./store'),
    $ = require('../node_modules/jquery/dist/jquery.js');

//var DATAS = {
//    invoice: '/app/accounting/transactions/custinvc.nl',
//    customrecord: '/app/common/custom/custrecordentry.nl'
//};

module.exports = function(casper) {
    var //lists = require('./queue-lists')(casper),
        records = require('./queue-records')(casper);

    var LISTS = [],
        RECORDS = {};

    var ssDir = store.ssDir;

    return {
        loadAll: function (baseURL) {

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
                    records.setRecords(RECORDS);

                    records.addQueue({url: baseURL, recId: '383'});
                    records.addQueue({url: baseURL, recId: '449'});
                    //Object.keys(RECORDS).forEach(function(recId) {
                    //    records.addQueue({url: baseURL, recId: recId});
                    //});
                });
            });
        }
    };
};