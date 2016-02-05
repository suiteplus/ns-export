'use strict';
var system = require('system'),
    args = system.args,
    fs = require('fs'),
    dirWork;

if (args && args.length >= 2) {
    dirWork = args[1];
} else {
    dirWork = fs.workingDirectory;
}

phantom.casperPath = dirWork + '/node_modules/casperjs';
phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');

var casper = require('casper').create({
        pageSettings: {
            loadImages:  false,        // The WebPage instance used by Casper will
            loadPlugins: false         // use these settings
        },
        logLevel: "warning",           // Only "info" level messages will be logged
        verbose: true                  // log messages will be printed out to the console
    }),
    $ = require('./node_modules/jquery/dist/jquery.js');

// make temporary directories
var tempDir = '.ns-exports',
    ssDir = tempDir + '/ss',
    metaDir = tempDir + '/meta',
    configFile = tempDir+'/nsconfig.json';

if (!fs.exists(configFile)) {
    console.log('Cannot load Netsuite Auth configuration. See http://github.com/suiteplus/nsconfig');
}
var config = JSON.parse(fs.read(configFile, 'utf-8'));

if (fs.exists(tempDir)) fs.removeTree(tempDir);
[tempDir, ssDir, metaDir].forEach(function(dir) {
    if (!fs.exists(dir)) fs.makeDirectory(dir);
});

var realm = config.realm || 'netsuite.com',
    base = config.hostname || 'system.' + realm,
    sysURL = 'https://' + base;

casper.start();

var records = require('./lib/manager-queues')(casper, config, dirWork);

console.log('############################################');
console.log('========>>> ns-export starting <<<==========');
console.log('--------------------------------------------');
console.log('account: ' + config.account);
console.log('user: ' + config.email);
console.log('realm: ' + config.realm || 'netsuite.com');
console.log('host: ' + sysURL);
if (config.bundle) {
    console.log('bundle: ' + config.bundle);
}
console.log('############################################');
casper.open(sysURL + '/app/login/nllogin.nl', {
   method: 'post',
    data:   {
        'email' : config.email,
        'password' : config.password,
        'jsenabled': 'T'
    }
}).then( function () {
    this.viewport(1280, 1024);
    this.capture(ssDir + '/question.jpg');

    var html = this.getHTML().toString().toLowerCase();
    var quiz = config.quiz,
        has = false;
    for (var i = 0; i < quiz.length; i++) {
        var q = quiz[i];
        //console.log('quiz', i, q.question, q.answer, !!~html.indexOf(q.question));
        if (html.indexOf(q.question) >= 0) {
            this.fillXPath('form', {'//input[@name="answer"]': q.answer}, true);
            has = true;
        }
    }

    if (!has) {
        this.echo('Question not found');
        casper.exit();
    }

    casper.wait(15000, function () {
        this.capture(ssDir + '/afterLogin.jpg');

        var html = this.getHTML().toString(),
            $html = $(html),
            $rows = $html.find('tr.uir-list-row-tr');

        for (var r = 0; r < $rows.length; r++) {
            var $row = $($rows[r]),
                rowTd = $row.find('td'),
                rowText = rowTd.filter('.listtext'),
                account = rowText.filter(':eq(1)').text();
            if (~account.indexOf(config.account)) {
                var tt = account.split('-'),
                    acc = tt[tt.length - 1].trim();
                this.click('tr.uir-list-row-tr a[href$=' + acc + ']');
                break;
            }
        }

        casper.wait(1000, function () {
            this.capture(ssDir + '/home.jpg');

            records.loadAll({
                url: sysURL,
                config: config,
                dir: dirWork
            });
        });
    });
});
casper.run();
