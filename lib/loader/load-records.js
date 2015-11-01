'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

module.exports = function(casper, init) {
    var $RecordIds = init.$RecordIds,
        $RecordTypes = init.$RecordTypes;

    var ssDir = store.ssDir;

    return function(opt) {
        var url = opt.url + '/app/common/custom/custrecords.nl?whence=';
        if (opt.config.bundle) {
            url += '&bundlefilter=BUNDLE_' + opt.config.bundle
        }
        // load records types
        casper.open(url).then(function () {
            this.capture(ssDir + '/custom-records.jpg');
            var html = this.getHTML().toString(),
                $html = $(html),
                rows = $html.find('tr.uir-list-row-tr');

            for (var r = 0; r < rows.length; r++) {
                var row = $(rows[r]),
                    recType = row.find('td:nth-child(3)').text().trim(),
                    recId = Number(row.find('td:nth-child(1) a').attr('href').match(/[0-9]+/g)[0]);

                $RecordTypes[recType] = recId;
                $RecordIds[recId] = recType;
            }

            console.log('Total Records: ' + rows.length);
        });
    };
};