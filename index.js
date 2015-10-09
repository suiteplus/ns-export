'use strict';
var casper = require('casper').create({
    // clientScripts:  [
    //     'includes/jquery.js',      // These two scripts will be injected in remote
    //     'includes/underscore.js'   // DOM on every request
    //  ],
    pageSettings: {
        loadImages:  false,        // The WebPage instance used by Casper will
        loadPlugins: false         // use these settings
    },
    logLevel: "info",              // Only "info" level messages will be logged
    verbose: true                  // log messages will be printed out to the console
});

var fs = require('fs'),
    params = JSON.parse(fs.read('./nsconfig.json', 'utf-8'));
//var nsconfig = require('nsconfig'),
//    params = nsconfig({}, true);


casper.start();

/*Processo de Login*/
/* faz o post direto na url do Netsuite*/
casper.open('https://system.netsuite.com/app/login/nllogin.nl', {
   method: 'post',
    data:   {
        'email' : params.email,
        'password' : params.password,
        'jsenabled': 'T'
    }
});

/* depois do post faz a validação da pergunta (2a validação do login)*/
casper.then( function () {
    this.viewport(1280,1024);
    this.capture('ss/question.jpg');

    var html = this.getHTML().toString().toLowerCase();
    var quiz = params.quiz,
        has = false;
    for (var i=0; i< quiz.length; i++) {
        var q = quiz[i];
        console.log('quiz', i, q.question, q.answer, !!~html.indexOf(q.question));
        if (html.indexOf(q.question) >= 0) {
            this.fillXPath('form', {'//input[@name="answer"]':q.answer},true);
            has = true;
        }
    }

    if (!has) {
        this.echo('Question not found');
        casper.exit();
    }

    casper.wait(15000);

});

/* Após o login abre a tela de Lista de Customers */
casper.then( function() {
    this.capture('ss/afterLogin.jpg');

    casper.open('https://system.na1.netsuite.com/app/common/entity/custjoblist.nl?Customer_STAGE=CUSTOMER&whence=');

    casper.then( function() {
        this.capture('ss/customer.jpg');
    });
});

casper.run();