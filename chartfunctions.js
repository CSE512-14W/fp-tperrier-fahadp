/*************
Helper Class: Dimensions
*************/
var Dimension = function(prop){
	prop = prop || {}
	var defaults = {
		top:10,
		right:10,
		bottom:10,
		left:10,
		width:1000,
		height:500
	}
	$.extend(true,defaults,prop);
	$.extend(this,defaults);
	this.width = this.width-this.left-this.right;
	this.height = this.height-this.top-this.bottom;
}

$.extend(Dimension.prototype,{
	total_width:function(){
		return this.width+this.left+this.right;
	},
	total_height:function(){
		return this.height+this.top+this.bottom;
	}
});

/************************
OrdredHash Map
*************************/
var OrderedHash = function() {
	var pub = {};
	
	pub.keys = [];
	pub.hash = {};
	pub.length = 0;
	
	pub.put = function(key,val) {
		if(!(key in this.hash)){
			this.keys.push(key);
		}//TODO: might want to remove  the element and set it to the end of ordered keys
		this.hash[key] = val;
		this.length++;
	}
	
	pub.get = function(key){
		if(key in this.hash){
			return this.hash[key];
		}
		else if(key.constructor == Number && key>=0 && key<this.keys.length) {
			return this.hash[this.keys[key]]
		}
	}
	
	pub.each = function(fn) {
		var that = this;
		this.keys.forEach(function(val,idx,arr){
			fn.call(that,that.hash[val],val,arr);
		});
	}
	
	
	return pub;
}

