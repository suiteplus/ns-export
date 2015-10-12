# ns-export
Export Record Type metadata to JSON

### Require

  * PhantomJS 1.9.+
  * CasperJS 1.1.+

### Install CasperJS + PhantomJS

```bash
   sudo npm install -g casperjs phantomjs
   
   casperjs --help
```
 
 **Output like**
 
```text
CasperJS version 1.1.0-beta3 at ..., using phantomjs version 1.9.8
Usage: casperjs ...
...
```

### Usage

**Clone project**

```bash 
   git clone https://github.com/suiteplus/ns-export.git
   cd ns-export-metadata/
   npm install
   npm run export
```


**Athentication Config**

Create a JSON file call **nsconfig.json**. Look his format in [nsconfig](https://github.com/suiteplus/nsconfig).
