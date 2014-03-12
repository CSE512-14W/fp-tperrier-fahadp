import json,code
"""
Transforms the raw json files into something a little smaller and more manageable.
"""


#parse data_elements 
data_elements = {}
raw_data_elements = json.load(open('raw_dataElements.json'))
for e in raw_data_elements:
	_data = {k:e[k] for k in e if k != '_data'}
	_data.update({k:e['_data'][k] for k in e['_data'] if k in ['dataElementGroups','domainType','zeroIsSignificant','dataSets','active','shortName','type','aggregationOperator']})
	data_elements[e['id']] = _data

#parse indicators 
indicators = {}
raw_indicators = json.load(open('raw_indicators.json'))
for e in raw_indicators:
	_data = {k:e[k] for k in e if k != '_data'}
	_data.update({k:e['_data'][k] for k in e['_data'] if k in ['description','denominator','numerator','annualized','indicatorType','denominatorDescription','shortName','numeratorDescription']})
	indicators[e['id']] = _data

data_sets = {}
raw_data_sets = json.load(open('raw_dataSets.json'))
for e in raw_data_sets:
	_data = {k:e[k] for k in e if k != '_data'}
	_data.update({k:e['_data'][k] for k in e['_data'] if k in ['skipOffline','fieldCombinationRequired','skipAggregation','allowFuturePeriods','version','dataElements','shortName','compulsoryDataElementOperands','mobile','periodType']})
	data_sets[e['id']] = _data
	
#parse organisation units 
organisation_units = {}
raw_organisation_units = json.load(open('raw_organisationUnits.json'))
for e in raw_organisation_units:
	_data = {k:e[k] for k in e if k != '_data'}
	_data.update({k:e['_data'][k] for k in e['_data'] if k in ['parent','openingDate','active','shortName','children']})
	organisation_units[e['id']] = _data

#parse data element groups 
data_element_groups = {}
raw_data_element_groups = json.load(open('raw_dataElementGroups.json'))
for e in raw_data_element_groups:
	_data = {k:e[k] for k in e if k != '_data'}
	_data.update({k:e['_data'][k] for k in e['_data'] if k in ['dataElements']})
	data_element_groups[e['id']] = _data


with open('dataElements.json','w') as jfp:
	json.dump(data_elements,jfp)
with open('dataSets.json','w') as jfp:
	json.dump(data_sets,jfp)
with open('indicators.json','w') as jfp:
	json.dump(indicators,jfp)
with open('organisationUnits.json','w') as jfp:
	json.dump(organisation_units,jfp)
with open('dataElementGroups.json','w') as jfp:
	json.dump(data_element_groups,jfp)

	
	
#code.interact(local=locals())