'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

module.exports = function(casper, init) {
    var $EntityFields = init.$EntityFields;

    var ssDir = store.ssDir;

    var entityOrder = [
        {entity: 'customer', col: 1},
        {entity: 'project', col: 2},
        {entity: 'vendor', col: 3},
        {entity: 'employee', col: 4},
        {entity: 'contact', col: 6},
        {entity: 'partner', col: 7}
    ];

    return function(opt) {
        var inactive = opt.showInactive ? 'T' : 'F',
            url = opt.url + '/app/common/custom/entitycustfields.nl?whence=&showall='+inactive;

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
                    rowTd = row.find('td'),
                    rowText = rowTd.filter('.listtext'),
                    rowCtr = rowTd.filter('.listtextctr'),
                    code = rowText.filter(':eq(2)').text().trim(),
                    id = Number(rowText.filter(':eq(0)').find('a').attr('href').match(/[0-9]+/g)[0]);

                entityOrder.forEach(function(e) {
                    var idxCol = e.col + (opt.showInactive ? 1 : 0),
                        entity = rowCtr.filter(':eq('+idxCol+')').text().trim() === 'Y';
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
