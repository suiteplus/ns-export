'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

module.exports = function(casper, init) {
    var $RecordIds = init.$RecordIds,
        $RecordTypes = init.$RecordTypes;

    var ssDir = store.ssDir;

    return function(opt) {
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
    };
};