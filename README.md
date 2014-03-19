D5: Data Drivin Documents Driving Development
==================
Fahad Pervaiz, Trevor Perrier (fahadp,tperrier)

![Overview](https://github.com/CSE512-14W/fp-tperrier-fahadp/raw/master/deliverables/d5-screenshot.png)
##Deliverables
* [Poster](https://github.com/CSE512-14W/fp-tperrier-fahadp/raw/master/deliverables/fahadp-tperrier-poster.pdf)
* [Paper](https://github.com/CSE512-14W/fp-tperrier-fahadp/raw/master/deliverables/fahadp-tperrier-paper.pdf)

##Abstract

## Running Instructions

Access our visualization at http://cse512-14w.github.io/fp-tperrier-fahadp/# or download this repository and run `python -m SimpleHTTPServer 8000` and access this from http://localhost:8000/.

Data for the default instal is stored at /fixtures/data-penta.json

To get data for a differnt indicator or data element use:
```
wget http://apps.dhis2.org/demo/api/analytics.json?dimension=dx:{indicatorID}&dimension=ou:LEVEL-1;LEVEL-2;LEVEL-3;LEVEL-4&dimension=pe:201401;201402;201403;201301;201302;201303;201304;201305;201306;201307;201308;201309;201310;201311;201312 > indicator-name-data.json
```
Where indicatorID is the DHIS2 data indicator you wish to get data for.
