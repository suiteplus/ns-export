'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

module.exports = function(casper, init) {
    var $RecordIds = init.$RecordIds,
        $ListIds = init.$ListIds;

    var ssDir = store.ssDir;

    return function(opt) {
        var url = opt.url + '/app/common/custom/custlists.nl?whence=';

        var bundle = opt.config.bundle;
        url += '&bundlefilter=' + (bundle ? ('BUNDLE_' + bundle) : 'BLANK');
        // load lists
        casper.open(url).then(function () {
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
    };
};
