/*
Initialization: Run on DOM Load
*/
$(document).ready(function() {
	
	//ajax load of json file
	$.when(
		$.ajax({dataType: 'json', url: '../../fixtures/dhis-data.json',}),
		$.ajax({dataType: 'json', url: '../../fixtures/data-penta.json',})
	).done(function(dhis,penta){
		console.log("Load Complete");
		DE.json_load(dhis[0],penta[0]);
	}).fail(function(){console.log('Json Load: Something Went Wrong')});
});

/*
Globals Object
*/
var G = {
	dims:{
		chart:new Dimension({width:900,height:500,top:10,right:20,bottom:100,left:60}),
	},
	axis:{
		chart:{},
	}
}

//add scale and axis to G.dims.chart
G.dims.chart.y = d3.scale.linear().range([G.dims.chart.height,0]); //0,0 is top left corner
G.dims.chart.x = d3.scale.ordinal().rangeRoundBands([0,G.dims.chart.width]);

G.axis.chart.y = d3.svg.axis().scale(G.dims.chart.y).orient('left');
G.axis.chart.x = d3.svg.axis().scale(G.dims.chart.x).tickSize(20,0).tickPadding(5).orient('bottom');

/*
Data Explore: DE
 - Name space for graph making logic
*/

DE = DataExplore = function() {
	
	/********
	Private functions
	*********/
	
	var getOrgChildren = function(nodeId){
		var node = DHIS.organisationUnits[nodeId], children = null;
		console.log(nodeId,node);
		if(node.children){
			return node.children.map(function(id){
				return{
					data:rawData.rows[id],
					name:DHIS.organisationUnits[id].shortName,
					id:id,
					parent:DHIS.organisationUnits[id].parent
				}
			});
		}
		return null;
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
	
	/************************
	Return a function to pass to D3 filters for the given period
	************************/
	var getPE = function(func){
		return function(d,i){
			if(d.data){
				if (Object.prototype.toString.call(func) == '[object Function]'){
					return func.call(null,d.data[brush_pos],i);
				}
				return d.data[brush_pos];
			}
		}
	}
	
	var sliderDomain = function(data){
		data = data || orgData;
		var keys = [];
		for(k in data[0].data){keys.push(k)}
		return keys;
	}
	
	var moveSlider = function(period){
		period = period || brush_pos;
		d3.select('#slider-ele .handle').transition().duration(400)
		.attr({
			cx:G.dims.chart.x(period)+ G.dims.chart.x.rangeBand()/2+5,
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
	var DHIS,rawData,orgData,brush_pos,colors = d3.scale.category20();
	
	/********
	Public functions
	*********/
	var pub = {}; // public namespace
	pub.t = getTranslate;
	pub.json_load = function(dhis,analytics){
		console.log('JSON Load: ',dhis,analytics);
		DHIS = G.dhis = dhis, rawData = G.data = processRaw(analytics);
		orgData = G.orgData = getOrgChildren(DHIS.orgRoot);
		orgData = G.orgData = getOrgChildren('jmIPBj66vD6');
		
		G.chartEle = d3.select("#bar-chart-ele")
		.attr({
			width:G.dims.chart.total_width(),
			height:G.dims.chart.total_height()
		});
		
		//g element to hold the chart
		G.chart = G.chartEle.append('g')
		.attr({
			transform:'translate('+G.dims.chart.left+','+G.dims.chart.top+')',
			class:'chart',
		});
		
		//g element to hold stacked bar during transition
		G.stacked = G.chartEle.append('g')
			.attr({
				transform:'translate('+G.dims.chart.left+','+G.dims.chart.top+')',
				class:'stack',
			});
			
		pub.make_bar_chart();
		pub.drill_up();
	}
	
	pub.make_bar_chart = function(){
		var dims = G.dims.chart
		brush_pos = '201301';
		//set dimensions that require data
		dims.barWidth = dims.width/orgData.length;
		dims.y.domain([0,d3.max(orgData,getPE())]);
		dims.x.domain(sliderDomain());
	
		var bars = G.chart.selectAll('g').data(orgData).enter().append('g')
			.attr({ 
				transform:getPE(function(d,i){return 'translate('+i*dims.barWidth + ',0)';})
				})
		bars.append('rect')
			.attr({
				width:dims.barWidth-1,
				height:getPE(function(d){return dims.height-dims.y(d)}),
				y:getPE(function(d){return dims.y(d)}),
				class:'bar',
				fill:function(d,i){return colors(i)},
				}).on('click',DE.drill_down);
		bars.append('g')
			.attr({
				class:'bar-label-ele',
				transform:getPE(function(d){return 'translate(5,'+(dims.y(d)+5)+')'}),
			})
			.append('text')
			.attr({
				class:'bar-label',
				transform:'rotate(90)',
			})
			.text(function(d){return d.name;});
			
				
		G.chartEle.append('g')
			.attr({
				class:'y axis',
				transform:'translate('+(dims.left-10)+','+dims.top+')'
			}).call(G.axis.chart.y)
				
		//append slider
		var bandWidth = G.dims.chart.x.rangeBand();
		var brush = d3.svg.brush()
			.x(dims.x)
			.clamp(true)
			.extent([0,0])
			.on('brush',function(){
				var i = Math.floor(d3.mouse(this)[0]/bandWidth);
				var value = i*bandWidth+bandWidth/2+5;
				var new_pos = dims.x.domain()[i];
				console.log('Clicked: ',new_pos,brush_pos);
				if(new_pos != brush_pos){
					brush_pos = new_pos;
					DE.change_bar_chart();
					d3.select(this).select('circle')
						.attr({
							cx:value,
						});
				}
			});
		
		var sliderEle = G.chartEle.append('g')
			.attr({
				id:'slider-ele',
				transform:'translate('+(dims.left+5)+','+(dims.height+25)+')',
				width:dims.width-5,
			}).call(brush);
			
			
		sliderEle.append('g')
			.attr({
				class:'x axis',
			})
			.call(G.axis.chart.x)
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
	
	pub.change_bar_chart = function(){
		console.log("Change Grpah: "+brush_pos);
		var dims = G.dims.chart;
		console.log(dims.y.domain(),orgData.map(getPE()));
		dims.y.domain([0,d3.max(orgData,getPE())]);
		console.log(dims.y.domain(),orgData.map(getPE()));
		
		G.chart.selectAll('rect').data(orgData).transition().duration(1000)
			.attr({
				height:getPE(function(d){console.log(d);return dims.height-dims.y(d)}),
				y:getPE(function(d){return dims.y(d)}),
			});
			
		
		G.chartEle.select('.y.axis').transition().duration(1000).call(G.axis.chart.y);
	}
	
	pub.drill_down = function(data,i){
		console.log('Click: ',data,i);
		
		//get proportions for height
		var parent_part = orgData[i].data[brush_pos];
		orgData = getOrgChildren(data.id);
		var children_part = d3.sum(orgData,getPE());
		var parent_max = G.dims.chart.y.domain()[1];
		var children_max = parent_max*children_part/parent_part;
		console.log(parent_part,parent_max,children_part,children_max);
		
		G.dims.chart.y.domain([0,children_max]);
		
		DE.make_stacked_chart(i);
		
		//Set  new axis vars
		G.dims.chart.y.domain([0,d3.max(orgData,getPE())]);
		G.dims.chart.barWidth = G.dims.chart.width/G.stacked.selectAll('g')[0].length;
		
		DE.unstack();
		DE.switch_stack();
	}
	
	pub.make_stacked_chart = function(i){
		var stack = 0;
		
		//add stack
		G.stacked.selectAll('g').data(orgData).enter().append('g')
			.attr({
				transform:'translate('+i*G.dims.chart.barWidth + ',0)',
			})
			.append('rect')
			.attr({
				width:G.dims.chart.barWidth-1,
				height:getPE(function(d,i){return G.dims.chart.height-G.dims.chart.y(d)}),
				y:getPE(function(d){var o = stack; stack += d; return G.dims.chart.y(d+o)}),
				class:'bar',
				fill:getPE(function(d,i){return colors(i)})
			});
	}
	
	pub.unstack = function(delay,type,dur){
		delay = delay || 0, dur = dur || 1000, type = type || 'sin';
		
		var t = d3.transition().duration(dur).delay(delay).ease(type);
		
		//hid bar chart
		t.selectAll('.chart g').attr({
			opacity:0,
		});
		
		//unwrap stack
		G.stacked.selectAll('g').transition().delay(delay).ease(type).duration(dur)
		.attr({
			transform:function(d,i){return 'translate('+i*G.dims.chart.barWidth + ',0)';}
		});
		
		G.stacked.selectAll('rect').transition().delay(delay).ease(type).duration(dur)
		.attr({
			width:G.dims.chart.barWidth-1,
			height:getPE(function(d,i){return G.dims.chart.height-G.dims.chart.y(d)}),
			y:getPE(function(d){return G.dims.chart.y(d)})
		});
	},
	
	pub.switch_stack = function(delay){
		console.log(delay);
		delay = delay || 1000
		console.log(delay);
		var oldStack = G.stacked.attr('class','chart');
		oldStack.selectAll('rect').on('click',DE.drill_down);;
		
		G.stacked = G.chart.attr('class','stack');
		G.stacked.selectAll('*').remove();
		
		G.chart = oldStack;
		
		//Add bar labels
		G.chart.selectAll('g').append('g')
			.attr({
				class:'bar-label-ele',
				transform:getPE(function(d){return 'translate(5,'+(G.dims.chart.y(d)+5)+')'}),
			})
			.append('text')
			.attr({
				class:'bar-label',
				transform:'rotate(90)',
				visibility:'hidden',
			})
			.text(function(d){return d.name;}).transition().delay(delay)
			.attr('visibility','visible');
	}
	
	pub.drill_up = function(){
		console.log(orgData[0]);
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
		var parent_part = parentOrgData[idx].data[brush_pos];
		var children_total = d3.sum(orgData,getPE());
		var parent_max = d3.max(parentOrgData,getPE());
		var children_max = parent_max*children_total/parent_part;
		console.log(parent_part,parent_max,children_total,children_max);
		
		//set new domain
		G.dims.chart.y.domain([0,children_max]);
		G.dims.chart.y.barWidth = G.dims.chart.y.width/parentOrgData.length;
		var stack = 0;
	
		//add stack
		G.chart.selectAll('g.bar-label-ele').remove();
		G.chart.selectAll('g').data(orgData).transition().duration(1000)
			.attr({
				transform:'translate('+idx*G.dims.chart.barWidth + ',0)',
			}).selectAll('rect')
			.attr({
				width:G.dims.chart.barWidth-1,
				height:getPE(function(d,i){return G.dims.chart.height-G.dims.chart.y(d)}),
				y:getPE(function(d){var o = stack; stack += d; return G.dims.chart.y(d+o)}),
				class:'bar',
			});
			
		//fade in new bars and out old bars
		G.dims.chart.y.domain([0,parent_max]);
		var bars = G.stacked.selectAll('g').data(parentOrgData).enter().append('g')
			.attr({
				transform:getPE(function(d,i){return 'translate('+i*G.dims.chart.barWidth + ',0)'}),
			});
		var rect = bars.append('rect').attr({
			width:G.dims.chart.barWidth-1,
			fill:getPE(function(d,i){return colors(i)}),
			height:0,
			y:G.dims.chart.y(0),
			class:'bar',
		});
		rect.transition().delay(1000).duration(1000)
			.attr({
				height:getPE(function(d){return G.dims.chart.height-G.dims.chart.y(d)}),
				y:getPE(function(d){return G.dims.chart.y(d)}),
			});
			
		orgData = parentOrgData;
		window.setTimeout(DE.switch_stack.bind(null,1),2000);
	}
	
	pub.play = function(){
		console.log('Play: ',brush_pos);
		var sd = sliderDomain();
		var idx = sd.indexOf(brush_pos);
		console.log('Play: ',brush_pos,idx);
		brush_pos = sd[++idx];
		pub.change_bar_chart(brush_pos);
		moveSlider(brush_pos);
		
		if(idx<=orgData.length){
			window.setTimeout(DE.play,2000);
		}
	}
	
	
	return pub;
}();
