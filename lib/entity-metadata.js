'use strict';

//var u = '/app/common/custom/entitycustfield.nl';

exports.getEntities = {
    '-1': require('./metadata/subsidiary'),
    '-3': require('./metadata/vendor'),
    '-4': require('./metadata/employee'),
    '-101': require('./metadata/class'),
    '-102': require('./metadata/department'),
    '-103': require('./metadata/location'),
    '-111': require('./metadata/currency'),
    '-112': require('./metadata/account')
};