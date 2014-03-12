/*
Initialization: Run on DOM Load
*/
$(document).ready(function() {
	
	//ajax load of json file
	$.ajax({
		dataType: 'json', 
		url: '../fixtures/tmp.json',
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
		chart:new Dimension({width:900,height:500,top:5,right:20,bottom:100,left:20}),
	}
}

//add scale and axis to G.dims.chart
G.dims.chart.y = d3.scale.linear().range([G.dims.chart.height,0]); //0,0 is top left corner


/*
Data Explore: DE
 - Name space for graph making logic
*/

DE = DataExplore = function() {
	
	var pub = {}; // public namespace

	
	
	pub.json_load = function(data) {
		console.log('Success');
		G.data = data;
		
		//bar chart element
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
			
		DE.make_bar_chart(data[0].data);
	}
	
	pub.make_bar_chart = function(data){
		var dims = G.dims.chart;
		//set dimensions that require data
		dims.barWidth = dims.width/data.length;
		dims.y.domain([0,d3.max(data)]);
		dims.x = d3.scale.ordinal()
			.domain(DE.slider_domain(G.data))
			.rangeRoundBands([0,dims.width]);

		G.chart.selectAll('g').data(data).enter().append('g')
			.attr({ 
				transform:function(d,i){return 'translate('+i*dims.barWidth + ',0)';}
				})
			.append('rect')
			.attr({
				width:dims.barWidth-1,
				height:function(d){return dims.height-dims.y(d)},
				y:function(d){return dims.y(d)},
				class:'bar'
				});
				
		//append slider
		
		var axis = d3.svg.axis()
			.scale(dims.x)
			.tickPadding(20)
			.orient('bottom');
	
		var bandWidth = G.dims.chart.x.rangeBand();
		var last_pos = null;
		var brush = d3.svg.brush()
			.x(dims.x)
			.clamp(true)
			.extent([0,0])
			.on('brush',function(){
				var i = Math.floor(d3.mouse(this)[0]/bandWidth);
				var value = i*bandWidth+bandWidth/2;
				var new_pos = dims.x.domain()[i];
				if(new_pos != last_pos){
					DE.change_bar_chart(new_pos);
					last_pos = new_pos;
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
			.call(axis);
		
		
		sliderEle.selectAll(".extent,.resize").remove();
		
		var handle = sliderEle.append('circle')
			.attr({
				class:'handle',
				r:10,
				fill:'red',
				cx:bandWidth/2,
			});
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