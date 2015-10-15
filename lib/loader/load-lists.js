'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

module.exports = function(casper, init) {
    var $RecordIds = init.$RecordIds,
        $ListIds = init.$ListIds;

    var ssDir = store.ssDir;

    return function(opt) {
        // load lists
        casper.open(opt.url + '/app/common/custom/custlists.nl?whence=').then(function () {
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
