'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

module.exports = function(casper, init) {
    var $RecordIds = init.$RecordIds,
        $RecordTypes = init.$RecordTypes;

    var ssDir = store.ssDir;

    return function(opt) {
        var inactive = opt.showInactive ? 'T' : 'F',
            url = opt.url + '/app/common/custom/custrecords.nl?whence=&showall='+inactive;

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
                    rowTd = row.find('td'),
                    rowText = rowTd.filter('.listtext'),
                    recType = rowText.filter(':eq(2)').text().trim(),
                    recId = Number(rowText.filter(':eq(0)').find('a').attr('href').match(/[0-9]+/g)[0]);

                $RecordTypes[recType] = recId;
                $RecordIds[recId] = recType;
            }

            console.log('Total Records: ' + rows.length);
        });
    };
};