'use strict';
var store = require('../store');

module.exports = function(casper, init) {
    var $RecordIds = init.$RecordIds;

    var queueLists = [];
    var downloadList = function (opt) {
        var recId = opt.recId,
            recType = $RecordIds[recId],
            xmlURL = opt.url + '/app/common/custom/custlist.nl?id=' + recId + '&e=T&xml=T';
        console.log('downloading data from List "' + recType + '"');
        casper.open(xmlURL).then(function () {
            var html = this.getHTML().toString(),
                $html = $(html);

            var fields = $html.find('machine[name=customvalue] line');
            var list = [];

            fields.each(function () {
                var $field = $(this);

                list.push({
                    internalid: parseInt($field.find('valueid').text()),
                    name: $field.find('value').text(),
                    inactive: ($field.find('isinactive').text() === 'T'),
                    abbreviation: $field.find('abbreviation').text()
                });
            });
            store.saveData(recType, list);
        });
    };

    var $cust = {
        addQueue: function(opt) {
            queueLists.push(opt);
        },
        start: function() {
            casper.eachThen(queueLists, function(res) {
                var opt = res.data;
                downloadList(opt);
            });
        },
        manager: function (opt) {
            if (!init.download || !init.download.lists) return;
            var $downloadLists = init.download.lists;
            for (var d = 0; d < $downloadLists.length; d++) {
                var recId = $downloadLists[d];
                $cust.addQueue({url: opt.url, recId: recId});
            }
            $cust.start();
        }
    };
    return $cust;
};
