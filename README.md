# ns-export [![NPM version][npm-image]][npm-url] 
Export Record Type metadata to JSON

### Require

  * Node

### Install [![Dependency Status][david-image]][david-url]

```bash
   sudo npm install -g ns-export
   
   nsexport --help
```
 
### Usage

**Command Line with nsconfig.json**

```bash 
   nsexport customrecord_japo 1 
```

**Example of nsconfig.jsn**

You can save nsconfing.json in ~/.ns/nsconfig.json. 
Read more in [nsconfig](htts://github.com/suiteplus/nsconfig). 

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

[david-url]: https://david-dm.org/suiteplus/ns-export
[david-image]: https://david-dm.org/suiteplus/ns-export.svg

[npm-url]: https://npmjs.org/package/ns-export
[npm-image]: http://img.shields.io/npm/v/ns-export.svg