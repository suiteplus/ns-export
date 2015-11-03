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

  - Set up your credentials by creating a [nsconfig.json](https://github.com/suiteplus/nsconfig) file in your current path 
or in `~/.ns/` using the following template. Security questions must be lowercased.

```json
{
  "email": "user@email.tt",
  "password": "****",
  "account": "JJHSN87932P",
  "realm": "na1.netsuite.com", // or "sandbox.netsuite.com"
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

  - Invoke the CLI tool.

```bash 
   echo "export 'customrecord_japo' metadatum"
   nsexport customrecord_japo
   
   echo "export 'customrecord_japo' metadatum and data from ID 293"
   nsexport customrecord_japo 293
   
   echo "export 'customrecord_japo' metadatum and data from ID 293 and his relationships"
   nsexport customrecord_japo 293 -d 2
   
   echo "export 'customrecord_japo' metadatum and data from ID 293 and his relationships from Bundle 1234"
   nsexport customrecord_japo 293 -d 2 -b 1234
   
   echo "export all metadata from Bundle 1234"
   nsexport '*' -b 1234
```

Fetched data are dumped into the `./ns-exports` folder.

[david-url]: https://david-dm.org/suiteplus/ns-export
[david-image]: https://david-dm.org/suiteplus/ns-export.svg

[npm-url]: https://npmjs.org/package/ns-export
[npm-image]: http://img.shields.io/npm/v/ns-export.svg