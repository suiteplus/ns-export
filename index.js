'use strict';
phantom.casperPath = './node_modules/casperjs';
phantom.injectJs(phantom.casperPath + '/bin/bootstrap.js');

var casper = require('casper').create({
        pageSettings: {
            loadImages:  false,        // The WebPage instance used by Casper will
            loadPlugins: false         // use these settings
        },
        logLevel: "info",              // Only "info" level messages will be logged
        verbose: true                  // log messages will be printed out to the console
    }),
    $ = require('./node_modules/jquery/dist/jquery.js');

var fs = require('fs'),
    params = JSON.parse(fs.read('./nsconfig.json', 'utf-8'));

// make temporary directories
var tempDir = '.ns-exports',
    ssDir = tempDir + '/ss',
    metaDir = tempDir + '/meta';

if (fs.exists(tempDir)) fs.removeTree(tempDir);
[tempDir, ssDir, metaDir].forEach(function(dir) {
    if (!fs.exists(dir)) fs.makeDirectory(dir); 
});

var base = params.realm || 'system.netsuite.com',
    sysURL = 'https://'+base,
    dotIdx = sysURL.indexOf('.'),
    na1URL = sysURL.substring(0, dotIdx) + '.na1' + sysURL.substring(dotIdx);

casper.start();

var records = require('./lib/manager-queues')(casper);

casper.open(sysURL + '/app/login/nllogin.nl', {
   method: 'post',
    data:   {
        'email' : params.email,
        'password' : params.password,
        'jsenabled': 'T'
    }
}).then( function () {
    this.viewport(1280, 1024);
    this.capture(ssDir + '/question.jpg');

    var html = this.getHTML().toString().toLowerCase();
    var quiz = params.quiz,
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

    casper.wait(15000, function() {
        this.capture(ssDir + '/afterLogin.jpg');

        var html = this.getHTML().toString(),
            $html = $(html),
            $rows = $html.find('tr.uir-list-row-tr');

        for (var r = 0; r < $rows.length; r++) {
            var $row = $($rows[r]);
            if (~$row.text().indexOf(params.account)) {
                this.click('span#' + $('span.checkbox_ck', $row)[0].id);
                break;
            }
        }

        casper.wait(1000, function () {
            this.capture(ssDir + '/home.jpg');

            records.loadAll(na1URL);
        });
    });
});
casper.run();