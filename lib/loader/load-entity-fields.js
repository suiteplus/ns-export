'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

module.exports = function(casper, init) {
    var $EntityFields = init.$EntityFields;

    var ssDir = store.ssDir;

    var entityOrder = [
        {entity: 'customer', col: 9},
        {entity: 'project', col: 10},
        {entity: 'vendor', col: 11},
        {entity: 'employee', col: 12},
        {entity: 'contact', col: 14},
        {entity: 'partner', col: 15}
    ];

    return function(opt) {
        var url = opt.url + '/app/common/custom/entitycustfields.nl?whence=';

        var bundle = opt.config.bundle;
        url += '&bundlefilter=' + (bundle ? ('BUNDLE_' + bundle) : 'BLANK');
        // load lists
        casper.open(url).then(function () {
            this.capture(ssDir + '/custom-entity-fields.jpg');
            var html = this.getHTML().toString(),
                $html = $(html),
                rows = $html.find('tr.uir-list-row-tr'),
                count = 0;

            for (var r = 0; r < rows.length; r++) {
                var row = $(rows[r]),
                    code = row.find('td:nth-child(4)').text().trim(),
                    id = row.find('td:nth-child(5)').text().trim();

                entityOrder.forEach(function(e) {
                    var entity = row.find('td:nth-child('+ e.col+')').text().trim() === 'Y';
                    if (entity) {
                        if (!$EntityFields[e.entity]) $EntityFields[e.entity] = {};
                        $EntityFields[e.entity][id] = code;
                        count++;
                    }
                });
            }
            console.log('Total Entity Fields: ' + count);
        });
    };
};
