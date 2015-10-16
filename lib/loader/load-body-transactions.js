'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

module.exports = function(casper, init) {
    var $TransactioFields = init.$TransactioFields;

    var ssDir = store.ssDir;

    return function(opt) {
        // load lists
        casper.open(opt.url + '/app/common/custom/bodycustfields.nl?whence=').then(function () {
            this.capture(ssDir + '/custom-body-transactions.jpg');
            var html = this.getHTML().toString(),
                $html = $(html),
                rows = $html.find('tr.uir-list-row-tr'),
                count = 0;

            for (var r = 0; r < rows.length; r++) {
                var row = $(rows[r]),
                    code = row.find('td:nth-child(4)').text().trim(),
                    id = row.find('td:nth-child(5)').text().trim();

                $TransactioFields[id] = code;
            }
            console.log('Total Body Transactions: ' + rows.length);
        });
    };
};