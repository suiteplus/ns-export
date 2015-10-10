'use strict';
var fs = require('fs'),
    $ = require('../node_modules/jquery/dist/jquery.js');

module.exports = function(casper) {
    var RECORDS = {};

    var tempDir = '.ns-exports',
        ssDir = tempDir + '/ss',
        metaDir = tempDir + '/meta';

    var downloadRecordXML = function (baseURL, recType) {
        var recId = RECORDS[recType],
            metaFile = metaDir + '/' + recType + '.json',
            metaObj = {code: recType, id: recId, fields: []},
            xmlURL = baseURL + '/app/common/custom/custrecord.nl?id=' + recId + '&e=T&xml=T';
        console.log('downloading Record Type: ', recType);
        //casper.download(xmlURL, xmlName, 'GET');
        casper.open(xmlURL).then(function() {
            this.capture(ssDir + '/record-type-'+recType+'.jpg');
            var html = this.getHTML().toString(),
                $html = $(html);

            metaObj.name = $html.find('recordname').text();
            metaObj.inactive = $html.find('isinactive').text() === 'T';

            var fields = $html.find('machine[name=customfield] line');
            for (var f=0; f<fields.length; f++) {
                var $field = $(fields[f]),
                    metaFieldObj = {};

                metaFieldObj.code = $field.find('fieldcustcodeid').text();
                metaFieldObj.id = $field.find('fieldid').text();
                metaFieldObj.desc = $field.find('fielddescr').text();
                metaObj.fields.push(metaFieldObj);
            }

            fs.write(metaFile, JSON.stringify(metaObj), 'w');
        });
    };

    return {
        loadAll: function (baseURL) {
            // load records type list
            casper.open(baseURL + '/app/common/custom/custrecords.nl').then(function () {
                this.capture(ssDir + '/record-list.jpg');
                var html = this.getHTML().toString(),
                    $html = $(html),
                    rows = $html.find('tr.uir-list-row-tr');

                for (var r = 0; r < rows.length; r++) {
                //for (var r = 10; r < 11; r++) {
                    var row = $(rows[r]),
                        recType = row.find('td:nth-child(3)').text().trim(),
                        recId = row.find('td:nth-child(4)').text().trim();

                    RECORDS[recType] = recId;
                    downloadRecordXML(baseURL, recType);
                }
            });
        }
    };
};

