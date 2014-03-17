/*
Initialization: Run on DOM Load
*/
$(document).ready(function() {
	
	G.crumbs = new BreadCrumbs('.breadcrumb',{name:'Sierra Leone',link:'#'});
	G.crumbs.refresh();
	
	//ajax load of json file
	$.when(
		$.ajax({dataType: 'json', url: '../../fixtures/dhis-data.json',}),
		$.ajax({dataType: 'json', url: '../../fixtures/data-penta.json',})
	).done(function(dhis,penta){
		console.log("Load Complete");
		DE.json_load(dhis[0],penta[0]);
		/*routie({
			':nodeID?':DE.graph_node,
		});*/
	}).fail(function(){console.log('Json Load: Something Went Wrong')});
});

/*
Globals Object
*/
var G = {}


/* Slider axis 
G.axis.chart.x = d3.svg.axis().scale(G.dims.chart.x)
	.tickSize(20,0).tickPadding(5).orient('bottom');
*/

/*
Data Explore: DE
 - Name space for graph making logic
*/

DE = DataExplore = function() {
	
	/********
	Private functions
	*********/
	
	var getOrgChildren = function(nodeId){
		nodeId = nodeId || _curOrg;
		var node = DHIS.organisationUnits[nodeId], children = null;

		if(node.children){
			return G.orgData = node.children.map(function(id){
				return{
					data:rawData.rows[id],
					name:DHIS.organisationUnits[id].shortName,
					id:id,
					parent:DHIS.organisationUnits[id].parent
				}
			});
		}
		return G.orgData = null;
	}
	
	var getChildIndex = function(nodeId){
		return _orgData.findIndex(function(ele,i){
			return ele.id == nodeId;
		});
	}
	
	/************************
	Return a function to pass to D3 filters for the given period
	************************/
	var getPE = function(func){
		return function(d,i){
			if(d.data){
				if (Object.prototype.toString.call(func) == '[object Function]'){
					return func.call(null,d.data[_curPeriod],i);
				}
				return d.data[_curPeriod];
			}
		}
	}
	

	var processRaw = function(raw){
		var orgHash = {};
		/*******************
		Assume order of row data in row element:
		 - data element
		 - org unit
		 - period
		 - value
		 *******************/
		raw.rows.forEach(function(r,i){
			var ou = r[1], pe = r[2], v = r[3];
			if(!(ou in orgHash)) orgHash[ou] = {};
			orgHash[ou][pe] = Number(v); // assume values are numeric
		});
		raw.rows = orgHash;
		return raw;
	}
	
	var orgNames = function(data){
		data = data || _orgData;
		return data.map(function(ele,i){
			return ele.name;
		});
	}
	
	
	/********
	Get translate of the elements transform
	**********/
	var getTranslate = function(ele){
		var transform = ele.attr('transform');
		var xy  = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(transform);
		return {x:Number(xy[1]),y:Number(xy[2])}
	}
	
	//private vars
	var DHIS,rawData,_orgData,_curPeriod,_curOrg,
	COLORS = d3.scale.ordinal()
		.range(["#ddc","#cdd","#cdc","#dcd","#ccd","#dcc","#ccb","#bcc","#cbc","#bbc","#bcb","#cbb","#dee","#ede","#eed","#edd","#dde","#ded"]);
	
/***********************************
Public functions
************************************/
	var pub = {}; // public name space

	pub.json_load = function(dhis,analytics){
		console.log('JSON Load: ',dhis,analytics);
		
		DHIS = G.dhis = dhis, rawData = G.data = processRaw(analytics);
		
		pub.OrgBarChart.make();
		pub.Map.make();
		pub.Slider.make();
	}
	
	pub.drill_down = function(nodeId){
		
		pub.OrgBarChart.drill_down(nodeId);
		pub.Map.drillDown(nodeId);
		pub.Map.hideNodeText(nodeId);
	}
	
	pub.mouseOver = function(nodeId){
		pub.Map.showNodeText(nodeId);
		pub.OrgBarChart.highlightBar(nodeId);
	}
	
	pub.mouseOut = function(nodeId){
		pub.Map.hideNodeText(nodeId);
		pub.OrgBarChart.unhighlightBar(nodeId);
	}
	
	
	pub.play = function(){
		console.log('Play: ',_curPeriod);
		var sd = sliderDomain();
		var idx = sd.indexOf(_curPeriod);
		console.log('Play: ',_curPeriod,idx);
		_curPeriod = sd[++idx];
		pub.change_bar_chart(_curPeriod);
		moveSlider(_curPeriod);
		
		if(idx<=orgData.length){
			G.play = window.setTimeout(DE.play,2000);
		}
	}
	
/*************************************
Name space for OrgBarChart Functions
************************************/
	
	
	pub.OrgBarChart = function(){
		
		var dims = new Dimension({width:958,height:720,top:20,right:40,bottom:150,left:60});
		var axis = {};
		
		//add scale and axis to dims
		dims.y = d3.scale.linear().range([dims.height,0]); //0,0 is top left corner
		dims.x = d3.scale.ordinal().rangeRoundBands([0,dims.width]);

		axis.y = d3.svg.axis().scale(dims.y).orient('left');
		axis.x = d3.svg.axis().scale(dims.x).orient('bottom');
		
		
		/************************************
		Public Functions
		**********************************/
		
		var bar_pub = {},CHART,STACK,SVG;
		
		var x_axis = function(selection,op){
			op = (op==undefined)?1:op;
			selection.call(axis.x);
			selection.selectAll('text, line')
				.attr({
					opacity:op,
				});
			selection.selectAll('text')
				.style('text-anchor','end')
				.attr({
					//'text-anchor':'end',
					dx:'-10px',
					dy:'-2px',
					transform:'rotate(-45)',
				});
		}
		
		var switch_stack = function(delay){
			delay = delay || 1000
			
			window.setTimeout(function(){
				var oldStack = STACK.attr('class','chart');
				
				STACK = CHART.attr('class','stack');
				STACK.selectAll('*').remove();
				
				CHART = oldStack;
			},delay);
		}
		
		bar_pub.make = function(selector,nodeId){
			console.log('Makeing Bar Chart....');
			selector = selector || '#bar-chart-ele';
			_curOrg = nodeId || DHIS.orgRoot;
			_orgData = getOrgChildren(_curOrg);
			_curPeriod = '201301';
			
			//set up chart ele
			SVG = G.chartEle = d3.select(selector)
			.attr({
				width:dims.total_width(),
				height:dims.total_height()
			});
				
			
			
			//g element to hold the chart
			CHART = SVG.append('g')
			.attr({
				transform:'translate('+dims.left+','+dims.top+')',
				class:'chart',
			});
			
			//g element to hold stacked bar during transition
			STACK = SVG.append('g')
				.attr({
					transform:'translate('+dims.left+','+dims.top+')',
					class:'stack',
				});
				
			//set dimensions that require data
			dims.barWidth = dims.width/_orgData.length;
			dims.y.domain([0,d3.max(_orgData,getPE())]);
			dims.x.domain(orgNames());
			
			var bars = CHART.selectAll('g').data(_orgData).enter().append('g')
			.attr({ 
				transform:getPE(function(d,i){return 'translate('+i*dims.barWidth + ',0)';})
				})
			bars.append('rect')
				.attr({
					width:dims.barWidth-4,
					height:getPE(function(d){return dims.height-dims.y(d)}),
					y:getPE(function(d){return dims.y(d)}),
					class:'bar',
					id:function(d,i){return d.id},
					fill:function(d,i){return COLORS(i)},
					}).on({
						click:function(d,i){DE.drill_down.call(window,d.id)},
						mouseover:function(d,i){DE.mouseOver.call(window,d.id)},
						mouseout:function(d,i){DE.mouseOut.call(window,d.id)},
					});
			
			//add axis
			SVG.append('g')
			.attr({
				class:'y axis',
				transform:'translate('+(dims.left-10)+','+dims.top+')'
			}).call(axis.y)
			
			SVG.append('g')
			.attr({
				class:'x axis',
				transform:'translate('+dims.left+','+(dims.top+dims.height+5)+')',
			}).call(x_axis)
		}
		
		pub.change_bar_chart = function(){
			console.log("Change Grpah: "+_curPeriod);

			dims.y.domain([0,d3.max(_orgData,getPE())]);
			
			CHART.selectAll('rect').data(_orgData).transition().duration(1000)
				.attr({
					height:getPE(function(d){return dims.height-dims.y(d)}),
					y:getPE(function(d){return dims.y(d)}),
				});
				
				
			//G.chartEle.select('.y.axis').transition().duration(1000).call(G.axis.chart.y);
		}
		
		bar_pub.drill_down = function(nodeId){
			var idx = getChildIndex(nodeId);
			if(idx<0) return; //exit if nodeId is not a current child
			
			//move stack to the front
			$('.stack').insertAfter($('.chart'));
			
			console.log('Dril Down: ',idx,nodeId,_orgData[nodeId]);
			
			//get proportions for height
			var parent_part = _orgData[idx].data[_curPeriod];
			_orgData = getOrgChildren(nodeId);
			var children_part = d3.sum(_orgData,getPE());
			var parent_max = dims.y.domain()[1];
			var children_max = parent_max*children_part/parent_part;
			//console.log(parent_part,parent_max,children_part,children_max);
			
			dims.y.domain([0,children_max]);
			dims.x.domain(orgNames());
			
			//add stacked bar chart at idx 
			var stack = 0;
			STACK.selectAll('g').data(_orgData).enter().append('g')
				.attr({
					transform:'translate('+idx*dims.barWidth + ',0)',
				})
				.append('rect')
				.attr({
					width:dims.barWidth-4,
					height:getPE(function(d,i){return dims.height-dims.y(d)}),
					y:getPE(function(d){stack += d; return dims.y(stack)}),
					class:'bar',
					id:function(d,i){return d.id},
					fill:getPE(function(d,i){return COLORS(i)})
				}).on({
					mouseover:function(d,i){DE.mouseOver.call(window,d.id)},
					mouseout:function(d,i){DE.mouseOut.call(window,d.id)},
				});
				
			var children = DHIS.organisationUnits[_orgData[0].id].children;
			if(children){ //only add click listener if there are children
				STACK.selectAll('rect').on({
					click:function(d,i){DE.drill_down.call(window,d.id)},
				});
			}
				
			//Set  new axis vars for child bar chart
			dims.y.domain([0,d3.max(_orgData,getPE())]);
			dims.barWidth = dims.width/_orgData.length;
			
			var dur = 1000, type = 'sin';
			//hide current bar chart
			CHART.selectAll('g').
			attr({
				opacity:1,
			}).transition().duration(dur).ease(type)
			.attr({
				opacity:0,
			});
			
			//unwrap stacked bar chart
			STACK.selectAll('g').transition().duration(dur).ease(type)
			.attr({
				transform:function(d,i){return 'translate('+i*dims.barWidth + ',0)';}
			});
			
			STACK.selectAll('rect').transition().duration(dur).ease(type)
			.attr({
				width:dims.barWidth-1,
				height:getPE(function(d,i){return dims.height-dims.y(d)}),
				y:getPE(function(d){return dims.y(d)})
			});
			
			
			SVG.select('.y.axis').transition().duration(dur).ease(type)
				.call(axis.y);
			
			//Fade out old x axis labels
			SVG.selectAll('.x.axis text, .x.axis line').transition().duration(500).ease(type)
			.attr('opacity',0);
			
			//fade in new 
			SVG.selectAll('.x.axis').transition().delay(500).call(x_axis,0)
				.transition().duration(500).ease(type)
				.selectAll('line,text').attr('opacity',1);
			
			switch_stack();
		}
		
		
		pub.drill_up = function(){
			console.log(orgData[0]);
			
			G.crumbs.pop();
			//G.crumbs.refresh();
			
			var parent = DHIS.organisationUnits[orgData[0].parent];
			var parentOrgData = getOrgChildren(parent.parent);
			var idx = 0;
			parentOrgData.forEach(function(d,i){
				if(d.id == parent.id){
					idx = i;
				}
			});
			
			console.log(parentOrgData[idx]);
			
			//get proportions for height
			var parent_part = parentOrgData[idx].data[_curPeriod];
			var children_total = d3.sum(orgData,getPE());
			var parent_max = d3.max(parentOrgData,getPE());
			var children_max = parent_max*children_total/parent_part;
			console.log(parent_part,parent_max,children_total,children_max);
			
			//set new domain
			dims.y.domain([0,children_max]);
			dims.barWidth = dims.width/parentOrgData.length;
			var stack = 0;
		
			//add stack
			G.chart.selectAll('g.bar-label-ele').remove();
			G.chart.selectAll('g').data(orgData).transition().duration(1000)
				.attr({
					transform:'translate('+idx*dims.barWidth + ',0)',
				}).selectAll('rect')
				.attr({
					width:dims.barWidth-1,
					height:getPE(function(d,i){return dims.height-dims.y(d)}),
					y:getPE(function(d){var o = stack; stack += d; return dims.y(d+o)}),
					class:'bar',
				});
				
			//fade in new bars and out old bars
			dims.y.domain([0,parent_max]);
			var bars = G.stacked.selectAll('g').data(parentOrgData).enter().append('g')
				.attr({
					transform:getPE(function(d,i){return 'translate('+i*dims.barWidth + ',0)'}),
				});
			var rect = bars.append('rect').attr({
				width:dims.barWidth-1,
				fill:getPE(function(d,i){return COLORS(i)}),
				height:0,
				y:dims.y(0),
				class:'bar',
			});
			rect.transition().delay(1000).duration(1000)
				.attr({
					height:getPE(function(d){return dims.height-dims.y(d)}),
					y:getPE(function(d){return dims.y(d)}),
				});
				
			orgData = parentOrgData;
			window.setTimeout(DE.switch_stack.bind(null,1),2000);
		
		}
		
		bar_pub.highlightBar = function(nodeId){
			CHART.select('#'+nodeId).classed('highlighted',true);
		}
		
		bar_pub.unhighlightBar = function(nodeId){
			CHART.select('#'+nodeId).classed('highlighted',false);
		}
		
		return bar_pub;
	}();
	
/*************************************
Name space for Map Functions
************************************/
	pub.Map =  function(){
		var map_width = 300, map_height = 300, map_scale = 5000,
			map_min_lat = 7,  map_max_lat = 10, 
			map_center_lat = 8.56, map_center_long = 11.7;

		var currentOrgUnitID, lowestLevel = false, curLevel = 2,
			svg, projection, path, prvTranslation;
			
		var map_pub = {};

		map_pub.make= function(selector){
			console.log('Makeing Map....');
			selector = selector || '#map-ele';
			currentOrgUnitID=DHIS.orgRoot;
			orgUnits=getChildren(currentOrgUnitID);
			var geoData = genFeatureCollectionObj(orgUnits);
			console.log('GeoData: ',geoData);
			svg = d3.select(selector)
				.attr("width", map_width)
				.attr("height", map_height)
			projection = d3.geo.albers()
				.center([0, map_center_lat])
				.rotate([map_center_long, 0])
				.parallels([map_min_lat, map_max_lat])
				.scale(map_scale)
				.translate([map_width / 2, map_height / 2]);
			path = d3.geo.path().projection(projection);

			drawMap(geoData,0);
		}
		
		var drawMap = function(geo,dur){
			dur = (dur==undefined)?1000:dur;
			console.log('Draw: ',dur);
			svg.selectAll().data(geo.features).enter().append("path")
				.attr({
					fill:function(d,i){ return COLORS(i)},
					class:function(d){return d.properties.parentId+" level"+d.properties.level;},
					d:path,
				})
				.on({
					mouseover:function(d){DE.mouseOver.call(window,d.properties.id)},
					mouseout:function(d){DE.mouseOut.call(window,d.properties.id)},
					click:function(d){DE.drill_down.call(window,d.properties.id)},
					})
				.transition().duration(dur).style('opacity', 1);
				
			svg.selectAll().data(geo.features).enter().append("text")
				.attr({
					class:function(d) { 
						out = 'subunit-label';
						out += d.properties.parentId+" "+d.properties.id;
						out += " level"+d.properties.level;
						return out},
					transform:function(d) { 
						d.properties.label_coord=path.centroid(d); 
						return "translate(" + d.properties.label_coord + ")"; },
					})
				.text(function(d) { return d.properties.name; })
				.on({
					mouseover:function(d){return DE.mouseOver.call(window,d.properties.id)},
					mouseout:function(d){return DE.mouseOut.call(window,d.properties.id)},
					click:function(d){DE.drill_down.call(window,d.properties.id)},
					});

		}
		
		map_pub.drillDown = function(orgUnitID){
			map_click(svg.select("."+orgUnitID+".level"+curLevel).datum());
		}
		
		var doingClick=null;
		var map_click = function(d){
			if(!doingClick){
				var pathc=[(map_width/2)-path.centroid(d)[0]*2,(map_height/2)-path.centroid(d)[1]*2];
				prvTranslation=pathc;
				svg.selectAll("path").transition().duration(500).style('opacity', 0.2)
					.attr("transform", "translate("+pathc+") scale(2)");
				svg.selectAll("text").each(function(d){
					var txy=[d.properties.label_coord[0]*2+pathc[0],d.properties.label_coord[1]*2+pathc[1]];
					d3.select(this).transition().duration(500).attr("transform","translate("+txy[0]+","+txy[1]+")");
				});
				doingClick=setTimeout(function(){drillDownMap(d.properties.id,d);},500);
			}
		};
		
		drillDownMap = function(orgUnitID,d){
			rmId=currentOrgUnitID;
			rmLevel=curLevel;
			curLevel=curLevel+1;
			currentOrgUnitID=orgUnitID;
			orgUnits=getChildren(currentOrgUnitID);
			var geoData = genFeatureCollectionObj(orgUnits);
			

			var bounds=d3.geo.bounds(d);
			var mapScale = map_scale*2;//16200;
			projection = d3.geo.albers()
				.center([0, (bounds[1][1]+bounds[0][1])/2 ])
				.rotate([ (Math.abs(bounds[1][0]+bounds[0][0])/2 -0.03) , 0])
				.parallels([bounds[0][1], bounds[1][1]])
				.scale(mapScale)
				.translate([map_width / 2  , map_height / 2  ]);
			path = d3.geo.path().projection(projection);
			if(geoData.features.length>0 && geoData.features[0].geometry!= null && geoData.features[0].geometry.type!="Point")
				setTimeout(function(){removeAreas(rmId,rmLevel);},500);
			else
				lowestLevel=true;
			drawMap(geoData);
			console.log(geoData);
			
		}
		
		map_pub.floatUp = function(){
			rmId=currentOrgUnitID;
			rmLevel=curLevel;
			curLevel=curLevel-1;
			currentOrgUnitID=DHIS.organisationUnits[currentOrgUnitID].parent;
			orgUnits=getChildren(currentOrgUnitID);
			var geoData = genFeatureCollectionObj(orgUnits);

			if(lowestLevel){
				removeAreas(rmId,rmLevel);
				svg.selectAll("path").transition().duration(1500).style('opacity', 1)
					.attr("transform", "scale(1)");
				svg.selectAll("text").each(function(d){
					var txy=[d.properties.label_coord[0],d.properties.label_coord[1]];
					d3.select(this).transition().duration(1500).attr("transform","translate("+txy[0]+","+txy[1]+")");
				});
				lowestLevel=false;
			}
			else{
				var pathc=prvTranslation;
				pathc[0]=((map_width/4));
				pathc[1]=((map_height/4));
				svg.selectAll("path").transition().duration(1500).attr("transform","translate("+pathc+") scale(0.5)");
				svg.selectAll("text").each(function(d){
					var txy=[d.properties.label_coord[0],d.properties.label_coord[1]];
					d3.select(this).transition().duration(1500).attr("transform","translate("+txy[0]+","+txy[1]+")");
				});

				projection = d3.geo.albers()
					.center([0, map_center_lat])
					.rotate([map_center_long, 0])
					.parallels([map_min_lat, map_max_lat])
					.scale(map_scale)
					.translate([map_width / 2, map_height / 2]);
				path = d3.geo.path().projection(projection);
				drawMap(geoData);
				setTimeout(function(){removeAreas(rmId,rmLevel);},1000);
			}
			
		}
		
		var removeAreas = function(parentId,level){
			svg.selectAll("."+parentId+".level"+level).data([]).exit().remove();
			doingClick=null;
		}

		map_pub.showNodeText = function(nodeId){
			svg.select("text."+nodeId).style({opacity:'1.0'});
		}
		
		map_pub.hideNodeText = function(nodeId){
			svg.select("text."+nodeId).style({opacity:'0.0'});
		}
		
		var genFeatureCollectionObj = function(orgUnits,parentID){
			var mapData = {};
			mapData.type="FeatureCollection";
			mapData.features=[];
			for(i=0;i<orgUnits.length;i++){
				org=DHIS.organisationUnits[orgUnits[i]];
				var feature = {};
				feature.type="Feature";
				feature.properties={id:org.id,name:org.shortName,parentId:org.parent,level:org.level};
				if(org.coordinates!=null)
					feature.geometry={type: (org.featureType!="Point")?"MultiPolygon":org.featureType,"coordinates":org.coordinates};
				else
					feature.geometry=null;
				mapData.features[i]=feature;
			}
			return mapData;
		}
		
		var getParent = function(orgUnitID){
			orgObj=DHIS.organizationUnit[orgUnitID];
			if(orgObj.parent!=null)
				return orgObj.parent;
			return null;
		}
		
		var getChildren = function(orgUnitID){
			orgObj=DHIS.organisationUnits[orgUnitID];
			if(orgObj.children!=null)
				return orgObj.children;
			return null;
		}
		
		return map_pub;
	}();

/*************************************
Name space for Slider Functions
************************************/
	pub.Slider =  function(){
		
		var width = 1000, height=50;	
		var x = d3.scale.ordinal().rangeRoundBands([0,width]);
		var axis = d3.svg.axis().scale(x)
		.orient('bottom').tickSize(20,0).tickPadding(5).orient('bottom');
		
		
		var sliderDomain = function(data){
				data = data || _orgData;
				var keys = [];
				for(k in data[0].data){keys.push(k)}
				console.log(keys);
				return keys;
			}
			
		var moveSlider = function(period){
			period = period || _curPeriod;
			d3.select('#slider-ele .handle').transition().duration(400)
			.attr({
				cx:G.dims.chart.x(period)+ G.dims.chart.x.rangeBand()/2+5,
			});
		}
		
		
		/************************************
		Public Functions
		**********************************/
		
		var slider_pub = {};
		
		slider_pub.make = function() {
		
			x.domain(sliderDomain());
			
			//append slider
			var bandWidth = x.rangeBand();
			var brush = d3.svg.brush()
				.x(x)
				.clamp(true)
				.extent([0,0])
				.on('brush',function(){
					var i = Math.floor(d3.mouse(this)[0]/bandWidth);
					var value = i*bandWidth+bandWidth/2+5;
					var new_pos = x.domain()[i];
					console.log('Clicked: ',new_pos,_curPeriod);
					if(new_pos != _curPeriod){
						_curPeriod = new_pos;
						DE.change_bar_chart();
						d3.select(this).select('circle')
							.attr({
								cx:value,
							});
					}
				});
			
			var sliderEle = d3.select('#slider-ele')
			.attr({
				width:width,
				height:height,
			})			
			.append('g')
				.attr({
					id:'slider',
					transform:'translate(0,'+height/2+')',
				}).call(brush);
				
				
			sliderEle.append('g')
				.attr({
					class:'x axis',
				})
				.call(axis)
			.selectAll('.tick')
				.attr({
					transform:function(){
						var t = getTranslate(d3.select(this));
						return 'translate('+t.x+','+(t.y-10)+')';
					}
				});
			sliderEle.selectAll(".extent,.resize").remove();
			sliderEle.select('.background')
				.attr({
					height:Math.ceil(sliderEle[0][0].getBBox().height),
					transform:'translate(0,-10)',
				});
			//Append Circle Handle
			sliderEle.append('circle')
				.attr({
					class:'handle',
					r:10,
					fill:'red',
					cx:bandWidth/2+5,
				});
		
		}
		
		
		return slider_pub;
	}();
	
	return pub;
}();
