'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

module.exports = function(casper, init) {

    var ssDir = store.ssDir;

    return function(opt) {
        // load records types
        casper.open(opt.url + '/app/common/custom/custrecords.nl?whence=').then(function () {
            this.capture(ssDir + '/custom-records.jpg');
            var html = this.getHTML().toString(),
                $html = $(html),
                rows = $html.find('tr.uir-list-row-tr');

            for (var r = 0; r < rows.length; r++) {
                var row = $(rows[r]),
                    recType = row.find('td:nth-child(3)').text().trim(),
                    recId = Number(row.find('td:nth-child(1) a').attr('href').match(/[0-9]+/g)[0]);

                init.$RecordTypes[recType] = recId;
                init.$RecordIds[recId] = recType;

            }

            console.log('Total Records: ' + rows.length);
        });
    };
};