'use strict';

var fs = require('fs'),
    jsdom = require('jsdom'),
    allMetas = require('../lib/metadata/all');

// update https://system.na1.netsuite.com/help/helpcenter/en_US/srbrowser/Browser2015_1/schema/record/account.html

let entities = {};
for (let e = 0; e < allMetas.length; e++) {
    var entity = allMetas[e];
    if (!entity.name) continue;

    let id = entity.id,
        name = entity.name.toLowerCase().replace(/ /g, '');
    entities[name] = id;
}

var htmls = fs.readdirSync('records'),
    h=0,
    notFound = [],
    found = [],
    all = {},
    allEntities = allMetas.map(function(entity) {
        all[entity.id] = entity.name;
        return parseInt(entity.id);
    });

var next = function(file) {
    var html = fs.readFileSync('records/' + file, 'utf8');
    jsdom.env(
        html,
        ["http://code.jquery.com/jquery.js"],
        function (err, window) {
            var $ = window.$,
                content = $('#contentPanel');

            var name = content.find('h1').text(),
                code = content.find('h3').text().replace('Internal ID:', '').trim();

            let mapFields = {name: 0};

            var metaObj = {
                "code": code,
                "id": entities[code] ? parseInt(entities[code]) : 0,
                "translations": {
                    "en": name
                },
                "inactive": false,
                "fields": [{
                    "code": "name",
                    "type": "TEXT",
                    "translations": {
                        "en": {
                            "label": "Name"
                        }
                    },
                    "mandatory": true
                }]
            };
            if (metaObj.id === 0) {
                notFound.push(metaObj.code);
            } else {
                found.push(metaObj.id);
            }

            console.log('Entity: ', code, '(' + name + ')');
            var childs = content.children();
            for (let i = 0; i < childs.length; i++) {
                let elem = $(childs[i]);
                if (elem.text() === 'Fields') {
                    let table = $(childs[++i]),
                        fields = table.find('tr[id^=field_]');

                    for (let r = 0; r < fields.length; r++) {
                        let field = $(fields[r]);

                        let code = field.find('td:nth-child(1)').text().trim(),
                            type = field.find('td:nth-child(2)').text().trim().toUpperCase(),
                            label = field.find('td:nth-child(4)').text().trim(),
                            mandatory = field.find('td:nth-child(5)').text().trim() === 'true',
                            help = field.find('td:nth-child(6)').text().trim();

                        let metaFieldObj = {
                            "code": code,
                            "type": type,
                            "translations": {
                                "en": {
                                    "label": label || code,
                                    "help": help !== '' ? help : undefined
                                }
                            },
                            "mandatory": mandatory
                        };

                        if (type === 'SELECT') {
                            if (~htmls.indexOf(code + '.html')) {
                                metaFieldObj.recordType = code;
                            } else if (~htmls.indexOf(label.toLowerCase().replace(/ /, '') + '.html')) {
                                metaFieldObj.recordType = label.toLowerCase().replace(/ /, '');
                            } else {
                                metaFieldObj.recordType = null;
                            }
                        }
                        if (!mapFields[code]) {
                            mapFields[code] = metaObj.fields.length;
                            metaObj.fields.push(metaFieldObj);
                        } else {
                            let ref = mapFields[code];
                            metaObj.fields[ref] = metaFieldObj;
                        }
                    }
                } else if (elem.text() === 'Search Joins') {
                    let table = $(childs[++i]),
                        fields = table.find('tr');

                    for (let r = 1; r < fields.length; r++) {
                        let field = $(fields[r]);

                        let code = field.find('td:nth-child(1)').text().trim(),
                            type = 'SELECT',
                            label = field.find('td:nth-child(2)').text().trim(),
                            actual = field.find('td:nth-child(3)').text().trim(),
                            mandatory = false;

                        let metaFieldObj = {
                            "code": code,
                            "type": type,
                            "translations": {
                                "en": {
                                    label: label || code
                                }
                            },
                            "mandatory": mandatory
                        };

                        if (~htmls.indexOf(actual.toLowerCase().replace(/ /, '') + '.html')) {
                            metaFieldObj.recordType = actual.toLowerCase().replace(/ /, '');
                        } else if (~htmls.indexOf(code + '.html')) {
                            metaFieldObj.recordType = code;
                        } else if (~htmls.indexOf(label.toLowerCase().replace(/ /, '') + '.html')) {
                            metaFieldObj.recordType = label.toLowerCase().replace(/ /, '');
                        } else {
                            metaFieldObj.recordType = code;
                        }

                        if (!mapFields[code]) {
                            mapFields[code] = metaObj.fields.length;
                            metaObj.fields.push(metaFieldObj);
                        } else {
                            let ref = mapFields[code],
                                origMetaFieldObj = metaObj.fields[ref];
                            if (!metaFieldObj.recordType && origMetaFieldObj.recordType) {
                                metaFieldObj.recordType = origMetaFieldObj.recordType;
                            }
                        }
                    }
                } else if (elem.text() === 'Search Filters' || elem.text() === 'Search Columns') {
                    let table = $(childs[++i]),
                        fields = table.find('tr');

                    for (let r = 1; r < fields.length; r++) {
                        let field = $(fields[r]);

                        let code = field.find('td:nth-child(1)').text().trim(),
                            type = field.find('td:nth-child(2)').text().trim().toUpperCase(),
                            label = field.find('td:nth-child(3)').text().trim(),
                            mandatory = false;

                        let metaFieldObj = {
                            "code": code,
                            "type": type,
                            "translations": {
                                "en": {
                                    label: label || code
                                }
                            },
                            "mandatory": mandatory
                        };

                        if (type === 'SELECT') {
                            if (~htmls.indexOf(code + '.html')) {
                                metaFieldObj.recordType = code;
                            } else if (~htmls.indexOf(label.toLowerCase().replace(/ /, '') + '.html')) {
                                metaFieldObj.recordType = label.toLowerCase().replace(/ /, '');
                            } else {
                                metaFieldObj.recordType = null;
                            }
                        }
                        if (!mapFields[code]) {
                            mapFields[code] = metaObj.fields.length;
                            metaObj.fields.push(metaFieldObj);
                        } else {
                            let ref = mapFields[code],
                                origMetaFieldObj = metaObj.fields[ref];
                            if (type === 'SELECT') {
                                if (!metaFieldObj.recordType && origMetaFieldObj.recordType) {
                                    metaFieldObj.recordType = origMetaFieldObj.recordType;
                                }
                            } else {
                                metaObj.fields[ref] = metaFieldObj;
                            }
                        }
                    }
                } else if (elem.text() === 'Tabs') {
                    metaObj.tabs = [];
                    let table = $(childs[++i]),
                        tabs = table.find('tr');
                    for (let r = 1; r < tabs.length; r++) {
                        let field = $(tabs[r]);

                        let code = field.find('td:nth-child(1)').text().trim(),
                            label = field.find('td:nth-child(2)').text().trim();

                        let metaTabObj = {
                            "code": code,
                            "translations": {
                                "en": label || code
                            }
                        };
                        metaObj.tabs.push(metaTabObj);
                    }
                } else if (elem.text() === 'Transform Types') {
                    metaObj.transformTypes = [];
                    let table = $(childs[++i]),
                        types = table.find('tr');
                    for (let r = 1; r < types.length; r++) {
                        let trans = $(types[r]);

                        let target = trans.find('td:nth-child(1)').text().trim(),
                            field = trans.find('td:nth-child(2)').text().trim();

                        let metaTransObj = {
                            "targetRecord": target,
                            "fieldDefault": field
                        };
                        metaObj.transformTypes.push(metaTransObj);
                    }
                } else if (elem.text() === 'Sublists') {
                    let count = content.find('h4').length;
                    if (count) metaObj.subLists = [];
                    for (let c = 0; c < count; c++) {
                        let subList = $(childs[++i]).text().split('-'),
                            code = subList[0].trim(),
                            name =  subList[1].trim(),
                            metaSubList = [];

                        let table = $(childs[++i]),
                            fields = table.find('tr[id^=field_]');
                        for (let r = 0; r < fields.length; r++) {
                            let field = $(fields[r]);

                            let code = field.find('td:nth-child(1)').text().trim(),
                                type = field.find('td:nth-child(2)').text().trim().toUpperCase(),
                                label = field.find('td:nth-child(3)').text().trim(),
                                mandatory = field.find('td:nth-child(4)').text().trim() === 'true';

                            let metaSubFieldObj = {
                                "code": code,
                                "type": type,
                                "translations": {
                                    "en": {
                                        label: label || code
                                    }
                                },
                                "mandatory": mandatory
                            };

                            if (type === 'SELECT') {
                                if (~htmls.indexOf(code + '.html')) {
                                    metaSubFieldObj.recordType = code;
                                } else if (~htmls.indexOf(label.toLowerCase().replace(/ /, '') + '.html')) {
                                    metaSubFieldObj.recordType = label.toLowerCase().replace(/ /, '');
                                } else {
                                    metaSubFieldObj.recordType = null;
                                }
                            }
                            metaSubList.push(metaSubFieldObj);
                        }

                        let metaSubObj = {
                            "code": code,
                            "translations": {
                                "en": name
                            },
                            "fields": metaSubList
                        };
                        metaObj.subLists.push(metaSubObj);
                    }
                }
            }

            metaObj.fields = metaObj.fields.sort(function(a, b) {
                if (a.code < b.code) {
                    return -1;
                } else if (a.code > b.code) {
                    return 1;
                } else {
                    return 0;
                }
            });

            let data = JSON.stringify(metaObj, null, '  ');
            !fs.existsSync('metadata') && fs.mkdirSync('metadata');
            fs.writeFileSync('metadata/' + code + '.json', data, 'utf8');

            if (h < htmls.length) {
                next(htmls[h++]);
            } else {
                //console.log(notFound);

                let entity = require('../lib/metadata/empty'),
                    others = allEntities.filter(function(id) {
                    return !~found.indexOf(id);
                });
                for (let i=0; i<others.length; i++) {
                    let clone = JSON.parse(JSON.stringify(entity)),
                        id = others[i],
                        name = all['' + id],
                        code = name.toLowerCase().replace(/ |\//g, '');
                    clone.id = id;
                    clone.code = code;
                    clone.translations.en = name;

                    console.log('++ Entity: ', code, '(' + name + ')');

                    let data = JSON.stringify(clone, null, '  ');
                    fs.writeFileSync('metadata/' + code + '.json', data, 'utf8');
                }
            }
        }
    );
};
next(htmls[h++]);

// #####  missing IDs
//'accountingbook',
//'activity',
//'amortizationschedule',
//'amortizationtemplate',
//'assemblybuild',
//'assemblyitem',
//'assemblyunbuild',
//'bintransfer',
//'binworksheet',
//'bundleinstallationscript',
//'calendarevent',
//'campaigntemplate',
//'cashrefund',
//'cashsale',
//'charge',
//'check',
//'classification',
//'clientscript',
//'couponcode',
//'creditmemo',
//'customerdeposit',
//'customerpayment',
//'customerrefund',
//'deposit',
//'depositapplication',
//'descriptionitem',
//'discountitem',
//'downloaditem',
//'entityaccountmapping',
//'estimate',
//'expensereport',
//'folder',
//'giftcertificate',
//'giftcertificateitem',
//'globalaccountmapping',
//'intercompanyjournalentry',
//'inventoryadjustment',
//'inventorycostrevaluation',
//'inventorycount',
//'inventorydetail',
//'inventoryitem',
//'inventorytransfer',
//'invoice',
//'itemaccountmapping',
//'itemdemandplan',
//'itemfulfillment',
//'itemgroup',
//'itemreceipt',
//'itemsupplyplan',
//'journalentry',
//'kititem',
//'landedcost',
//'lead',
//'lotnumberedassemblyitem',
//'lotnumberedinventoryitem',
//'manufacturingcosttemplate',
//'manufacturingoperationtask',
//'manufacturingrouting',
//'markupitem',
//'massupdatescript',
//'message',
//'nexus',
//'noninventoryitem',
//'note',
//'otherchargeitem',
//'othername',
//'paycheckjournal',
//'paymentitem',
//'payrollitem',
//'phonecall',
//'portlet',
//'projectexpensetype',
//'promotioncode',
//'prospect',
//'purchaseorder',
//'purchaserequisition',
//'reallocateitem',
//'resourceallocation',
//'restlet',
//'returnauthorization',
//'revenuecommitment',
//'revenuecommitmentreversal',
//'revrecschedule',
//'revrectemplate',
//'salesorder',
//'salestaxitem',
//'scheduledscript',
//'scheduledscriptinstance',
//'scriptdeployment',
//'serializedassemblyitem',
//'serializedinventoryitem',
//'serviceitem',
//'statisticaljournalentry',
//'subtotalitem',
//'suitelet',
//'supportcase',
//'taxacct',
//'taxgroup',
//'taxtype',
//'timebill',
//'timeentry',
//'timesheet',
//'topic',
//'transferorder',
//'usereventscript',
//'vendorbill',
//'vendorcredit',
//'vendorpayment',
//'vendorreturnauthorization',
//'workflowactionscript',
//'workorder',
//'workorderclose',
//'workordercompletion',
//'workorderissue'