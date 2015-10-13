'use strict';
var store = require('./store');

module.exports = function(casper, opt) {
    var RECORDS = opt.RECORDS;

    var dataDir = store.dataDir;

    var queueListEmpty = true,
        queueLists = [];
    var donwloadList = function (opt) {
        if (queueListEmpty) {
            queueListEmpty = false;

            var recId = opt.recId,
                recType = RECORDS[recId],
                dataFile = dataDir + '/' + (recType || recId) + '.json',
                xmlURL = opt.url + '/app/common/custom/custlist.nl?id=' + recId + '&e=T&xml=T';
            console.log('downloading data from List "' + recType + '"');
            casper.open(xmlURL).then(function() {
                var html = this.getHTML().toString(),
                    $html = $(html);

                var fields = $html.find('machine[name=customvalue] line');
                var list = [];

                fields.each(function() {
                    var $field = $(this);

                    list.push({
                        internalid: parseInt($field.find('valueid').text()),
                        name: $field.find('value').text(),
                        inactive: ($field.find('isinactive').text() === 'T'),
                        abbreviation: $field.find('abbreviation').text()
                    });
                });
                store.saveJSON(dataFile, list);

                // execute next resolveFieldRef
                var queue = queueLists.shift();
                queueListEmpty = true;

                queue && donwloadList(queue.opt);
            });
        } else {
            queueLists.push({opt: opt});
        }
    };

    return {addQueue: donwloadList};
};
