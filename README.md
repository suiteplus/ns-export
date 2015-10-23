# ns-export [![NPM version][npm-image]][npm-url] 

Export Netsuite's Record Type metadata to JSON.

### Require

  * Node

### Install [![Dependency Status][david-image]][david-url]

```bash
   sudo npm install -g ns-export
   
   nsexport --help
```
 
### Usage

_nsexport_ uses [phantomjs](http://www.phantomjs.org) to peek into an account and
fetch metadata.

  1. Set up your credentials by creating a [nsconfig.json](htts://github.com/suiteplus/nsconfig) file in your current path 
or in `~/.ns/` using the following template: 

```json
{
  "email": "user@email.tt",
  "password": "****",
  "account": "JJHSN87932P",
  "realm": "system.netsuite.com",
  "quiz": [
    {
      "question": "question 1",
      "answer": "answer 1"
    }, {
      "question": "question 2",
      "answer": "answer 2"
    }, {
      "question": "question 3",
      "answer": "answer 3"
    }
  ]
} 
```

  2. Invoke the CLI tool.

```bash 
   nsexport customrecord_japo 1 
```


[david-url]: https://david-dm.org/suiteplus/ns-export
[david-image]: https://david-dm.org/suiteplus/ns-export.svg

[npm-url]: https://npmjs.org/package/ns-export
[npm-image]: http://img.shields.io/npm/v/ns-export.svg