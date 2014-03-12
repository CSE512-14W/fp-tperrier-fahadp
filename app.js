/*
Initialization: Run on DOM Load
*/
$(document).ready(function() {
	
	//ajax load of json file
	$.ajax({
		dataType: 'json', 
		url: '../fixtures/drill_tmp.json',
		success:DE.json_load,
		complete:function(jqXHR,s){
			console.log(jqXHR);
			console.log(s);
			G.xhr = jqXHR;
		}
	});

});

/*
Globals Object
*/
var G = {
	dims:{
		chart:new Dimension({width:900,height:500,top:5,right:10,bottom:100,left:60}),
	},
	axis:{
		chart:{},
	}
}

//add scale and axis to G.dims.chart
G.dims.chart.y = d3.scale.linear().range([G.dims.chart.height,0]); //0,0 is top left corner
G.axis.chart.y = d3.svg.axis().scale(G.dims.chart.y).orient('left')

/*
Data Explore: DE
 - Name space for graph making logic
*/

DE = DataExplore = function() {
	
	var pub = {}; // public namespace

	
	
	pub.json_load = function(data) {
		console.log('Success');
		G.data = data;
		
		//set dimensions that require data
		G.dims.chart.barWidth = G.dims.chart.width/data.length;
		G.dims.chart.y.domain([0,d3.max(data,function(d){return d3.sum(d)})]);
		
		//bar chart element
		G.chartEle = d3.select('body').append('svg')
			.attr({
				width:G.dims.chart.total_width(),
				height:G.dims.chart.total_height(),
				id:'#bar-chart-ele'
			});
		
		//g element to hold the chart
		G.chart = G.chartEle.append('g')
			.attr({
				transform:'translate('+G.dims.chart.left+','+G.dims.chart.top+')',
				class:'chart',
			});
			
		G.stacked = G.chartEle.append('g')
			.attr({
				transform:'translate('+G.dims.chart.left+','+G.dims.chart.top+')',
				class:'stack',
			});
			
		DE.make_bar_chart(data);
		//DE.make_stacked_chart(data,0);
	}
	
	pub.make_bar_chart = function(data){
		var dims = G.dims.chart;
		
		G.chart.selectAll('g').data(data).enter().append('g')
			.attr({ 
				transform:function(d,i){return 'translate('+i*dims.barWidth + ',0)';},
				opacity:1,
				})
			.append('rect')
			.attr({
				width:dims.barWidth-1,
				height:function(d){return dims.height-dims.y(d3.sum(d))},
				y:function(d){return dims.y(d3.sum(d))},
				class:'bar'
				})
			.on('click',DE.stack_click);
				
		G.chartEle.append('g')
			.attr({
				class:'y axis',
				transform:'translate('+(dims.left-10)+','+dims.top+')'
			}).call(G.axis.chart.y)
	}
	
	pub.make_stacked_chart = function(data,i){
		var stack = 0, colors = d3.scale.category20();
			
		//add stack
		G.stacked.selectAll('g').data(data).enter().append('g')
			.attr({
				transform:function(d){return 'translate('+i*G.dims.chart.barWidth + ',0)';}
			})
			.append('rect')
			.attr({
				width:G.dims.chart.barWidth-1,
				height:function(d){return G.dims.chart.height-G.dims.chart.y(d)},
				y:function(d){var o = stack; stack += d; return G.dims.chart.y(d+o)},
				class:'bar',
				fill:function(d,i){return colors(i)}
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
		G.dims.chart.barWidth = G.dims.chart.width/G.stacked.selectAll('g')[0].length;
		G.stacked.selectAll('g').transition().delay(delay).ease(type).duration(dur)
		.attr({
			transform:function(d,i){return 'translate('+i*G.dims.chart.barWidth + ',0)';}
		});
		
		G.stacked.selectAll('rect').transition().delay(delay).ease(type).duration(dur)
		.attr({
			width:G.dims.chart.barWidth-1,
			y:function(d){return G.dims.chart.y(d)}
		});
	}
	
	pub.switch_stack = function(delay,type,dur){
		delay = delay || 1000, dur = dur || 1000, type = type || 'sin';
		var t = G.chartEle.transition().delay(delay).ease(type).duration(dur);
		
		
		t.selectAll('.stack rect').attr({
			height:function(d){return G.dims.chart.height-G.dims.chart.y(d)},
			y:function(d){return G.dims.chart.y(d)},
		});
		
		t.select('.y.axis').call(G.axis.chart.y);
		
		
	}
	
	pub.stack_click = function(data,i){
		DE.make_stacked_chart(data,i);
		DE.unstack();
		//change y domain
		G.dims.chart.y.domain([0,d3.max(data)]);
		DE.switch_stack();
	}
	
	pub.change_bar_chart = function(period){
		//find the correct data set
		var i=0;
		for(;i<G.data.length;i++){
			if(G.data[i].period == period)
				break;
		}
		
		console.log("Change Grpah: "+i);
		
		var data = G.data[i].data;
		var dims = G.dims.chart;
		G.chart.selectAll('rect').data(data).transition().duration(1000)
			.attr({
				height:function(d){return dims.height-dims.y(d)},
				y:function(d){return dims.y(d)},
			});
	}
	
	pub.slider_domain = function(data){
		return data.map(function(d){
			return d.period;
		});
	}

	return pub;
}();