'use strict';
var store = require('../store'),
    $ = require('../../node_modules/jquery/dist/jquery');

var FieldMetadata = require('../utils/field-metadata');

module.exports = function(casper, init) {
    var $DefaultMetas = init.$DefaultMetas,
        $TransactioFields = init.$TransactioFields,
        $Metadatas = init.$Metadatas;

    var findBodyTransMetadata = function (opt) {
        var transIds = Object.keys($TransactioFields);
        if (!transIds || !transIds.length) {
            //casper.log('Entity Fields not found for Record "'+entity+'"', 'warning');
            return;
        }
        $Metadatas.transaction = $DefaultMetas['-30'];
        var metaObj = $Metadatas.transaction;

        console.log('downloading Body Transaction');


        casper.eachThen(transIds, function(res) {
            var trasnId = res.data,
                code =  $TransactioFields[trasnId],
                xmlURL = opt.url + '/app/common/custom/bodycustfield.nl?id=' + trasnId + '&e=T&xml=T',
                metaFieldObj = {
                    code: code,
                    id: parseInt(trasnId),
                    translations: {en: {}}
                };

            casper.open(xmlURL).then(function () {
                var html = this.getHTML().toString(),
                    $html = $(html),
                    fieldMeta = new FieldMetadata($html, metaObj, init);

                fieldMeta.getFieldMetadata(metaFieldObj);
                metaObj.fields.push(metaFieldObj);
            });
        });
        casper.then(function() {
            store.saveMetadata(metaObj);
        });
    };


    var $cust = {
        start: function (opt) {
            findBodyTransMetadata(opt);
        },
        manager: function (opt) {
            //
            if (~init.download.metadatas.indexOf('-30')) {
                $cust.start(opt);
            }
        }
    };
    return $cust;
};