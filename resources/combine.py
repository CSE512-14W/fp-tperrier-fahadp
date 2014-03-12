import json,code,pprint
"""
Combine the JSON files into one file 
"""

def id_list(obj,key):
	if key in obj:
		return [d['id'] for d in obj[key]]
	else:
		return None


file_names = ['dataElements','dataSets','indicators','organisationUnits','dataElementGroups']
ll = locals()
for f in file_names:
	ll[f] = json.load(open(f+'.json'))

#data sets
_dataSets = {}	
for id,obj in dataSets.iteritems():
	_data = {k:obj[k] for k in obj if k in ['name','id','shortName','periodType']}
	_data['dataElements'] = id_list(obj,'dataElements')
	if _data['dataElements']:
		_dataSets[id] = _data
	
#date elements
_dataElements = {}
for id,obj in dataElements.iteritems():
	_data = {k:obj[k] for k in obj if k in ['name','id','shortName']}
	_data['dataSets'] = id_list(obj,'dataSets')
	_data['dataElementGroups'] = id_list(obj,'dataElementGroups')
	if _data['dataSets']:
		_dataElements[id] = _data

#indicators
_indicators = {}
for id,obj in indicators.iteritems():
	_data = {k:obj[k] for k in obj if k in ['name','id','shortName','denominatorDescription','numeratorDescription']}
	_indicators[id] = _data
	
#orgUnits
_organisationUnits, _orgRoot = {},None
for id,obj in organisationUnits.iteritems():
	_data = {k:obj[k] for k in obj if k in ['name','id','shortName','level']}
	if obj['parent']:
		_data['parent'] = obj['parent']['id']
	else:
		_data['parent'] = None
		_orgRoot = id
	_data['children'] = id_list(obj,'children')
	_organisationUnits[id] = _data
	
#dataElmentGroups
_dataElementGroups = {}
for id,obj in dataElementGroups.iteritems():
	_data = {k:obj[k] for k in obj if k in ['name','id','shortName']}
	_data['dataElements'] = id_list(obj,'dataElements')
	if _data['dataElements']:
		_dataElementGroups[id] = _data

with open('data.json','w') as jfp:
	json.dump({'dataElements':_dataElements,'dataSets':_dataSets,'indicators':_indicators,'organisationUnits':_organisationUnits,'orgRoot':_orgRoot,'dataElementGroups':_dataElementGroups},jfp)