'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

module.exports = function(casper, init) {
    var $RecordIds = init.$RecordIds,
        $RecordTypes = init.$RecordTypes;

    var ssDir = store.ssDir;

    return function(opt) {
        var url = opt.url + '/app/common/custom/custrecords.nl?whence=';

        var bundle = opt.config.bundle;
        url += '&bundlefilter=' + (bundle ? ('BUNDLE_' + bundle) : 'BLANK');
        // load records types
        casper.open(url).then(function () {
            this.capture(ssDir + '/custom-records.jpg');
            var html = this.getHTML().toString(),
                $html = $(html),
                rows = $html.find('tr.uir-list-row-tr');

            for (var r = 0; r < rows.length; r++) {
                var row = $(rows[r]),
                    recType = row.find('td').filter('.listtext').filter(':eq(2)').text().trim(),
                    recId = Number(row.find('td').filter('.listtext').filter(':eq(0)').find('a').attr('href').match(/[0-9]+/g)[0]);

                $RecordTypes[recType] = recId;
                $RecordIds[recId] = recType;
            }

            console.log('Total Records: ' + rows.length);
        });
    };
};