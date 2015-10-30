'use strict';
var store = require('../store');

module.exports = function($html, metaObj, init) {
    var $RecordIds = init.$RecordIds,
        $Metadatas = init.$Metadatas;

    this.getFieldMetadata = function(metaFieldObj, dataFields) {
        var fieldId = metaFieldObj.id;
        metaFieldObj.type = $html.find('fieldtype').text();
        metaFieldObj.mandatory = $html.find('ismandatory').text() === 'T';
        if ($html.find('isinactive').text() === 'T') {
            metaFieldObj.inactive = true;
        }
        if ($html.find('isformula').text() === 'T') {
            metaFieldObj.isFormula = true;
            metaFieldObj.default = $html.find('defaultvalue').text();
        }

        // ##########################
        // Translations
        // ##########################
        var translations = $html.find('machine[name=translations] line');
        translations.each(function () {
            var $translate = $(this);
            if (!$translate.find('label').length) return;
            var label = $translate.find('label').text(),
                locale = $translate.find('locale').text(),
                help = $translate.find('help').text();

            metaFieldObj.translations[locale] = {
                label: label,
                help: help
            };
        });
        var englishTrans = metaFieldObj.translations.en;
        ['label', 'help'].forEach(function(field) {
            if (!englishTrans[field]) {
                englishTrans[field]  = $html.find(field+':first').text();
            }
        });

        // ##########################
        // validate Field Types
        // ##########################
        if (metaFieldObj.type === 'SELECT') {
            var recIdRef = $html.find('fldcurselrectype');
            if (recIdRef && recIdRef.length) {
                metaFieldObj.recordType = $RecordIds[recIdRef.text()];
                if (!metaFieldObj.recordType) {
                    metaFieldObj.recordType = parseInt(recIdRef.text());
                    console.log('----> NOT FOUND', fieldId, '"' + recIdRef.text() + '"', metaFieldObj.type);
                } else if (dataFields) {
                    dataFields.push(recIdRef.text());
                }
            } else {
                console.log('----->>> NO SELECT', fieldId, metaFieldObj.type);
            }

            // ##########################
            // Resolve Parents
            // ##########################
            if (metaFieldObj.recordType && $html.find('isparent').text() === 'T') {
                var pType = metaFieldObj.recordType,
                // clone this column
                    pField = JSON.parse(JSON.stringify(metaFieldObj));
                pField.recordType = $RecordIds[metaObj.id];
                pField.parentRef = true;
                pField.noTranslation = "look: "+ pField.recordType;
                delete pField.translations;

                if (!$Metadatas[pType]) {
                    if (!$Metadatas['$$' + pType]) {
                        $Metadatas['$$' + pType] = {
                            code: pType,
                            fields: []
                        };
                    }
                    $Metadatas['$$' + pType].fields.push(pField);
                } else {
                    if (!$Metadatas[pType].fields) {
                        $Metadatas[pType].fields = [];
                    }
                    $Metadatas[pType].fields.push(pField);
                    // re-save
                    store.saveMetadata($Metadatas[pType]);
                }

                metaFieldObj.parent = true;
            }
        }

        var source = $html.find('sourcefrom');
        if (source && source.length) {
            metaFieldObj.source = {
                column: source.text().toLowerCase(),
                join: $html.find('sourcelist').text().toLowerCase(),
                recordType: $RecordIds[$html.find('sourcelistrecordtype').text()]
            };
        }
        return metaFieldObj;
    };
};
