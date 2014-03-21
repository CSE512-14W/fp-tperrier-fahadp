D5: Data Drivin Documents Driving Development
==================
Fahad Pervaiz, Trevor Perrier (fahadp,tperrier)

![Overview](https://github.com/CSE512-14W/fp-tperrier-fahadp/raw/master/deliverables/d5-screenshot.png)
##Deliverables
* [Poster](https://github.com/CSE512-14W/fp-tperrier-fahadp/raw/master/deliverables/fahadp-tperrier-poster.pdf)
* [Paper](https://github.com/CSE512-14W/fp-tperrier-fahadp/raw/master/deliverables/fahadp-tperrier-paper.pdf)

##Abstract
The collection of health system data is recognized as an important tool for international development.  With the collection of large amounts of data there exists a need to have better tools for exploring and analyzed this data.  In this class project we designed and built a plugin for the District Health and Information System v2 (DHIS2).  Our main goal was to create a simple interaction using familial visualization elements such as bar-charts and maps.  We wanted to make it easy for someone to explore data reports at multiple levels of the organizational hierarchy for the country.  The end goal of this project is a DHIS2 application that can be run in the cloud for any instance of DHIS2.

## Running Instructions

Access our visualization at http://cse512-14w.github.io/fp-tperrier-fahadp/# or download this repository and run `python -m SimpleHTTPServer 8000` and access this from http://localhost:8000/.

Data for the default instal is stored at /fixtures/data-penta.json

To get data for a differnt indicator or data element use:
```
wget http://apps.dhis2.org/demo/api/analytics.json?dimension=dx:{indicatorID}&dimension=ou:LEVEL-1;LEVEL-2;LEVEL-3;LEVEL-4&dimension=pe:201401;201402;201403;201301;201302;201303;201304;201305;201306;201307;201308;201309;201310;201311;201312 > indicator-name-data.json
```
Where indicatorID is the DHIS2 data indicator you wish to get data for.
