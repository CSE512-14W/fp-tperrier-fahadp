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

/*****************************
Bread Crumbs Class
*******************************/
var BreadCrumbs = function(selector,init){
	
	this.crumbs = []
	if(init && init.constructor == Object){
		this.crumbs.push(init);
	}else if (init && init.constructor == Array){
		console.log('Array');
		this.crumbs = init;
	}
	
	this.length = this.crumbs.length;
	
	this.$ele = $('ol');
	if( selector && selector.constructor == jQuery){
		this.$ele = selector;
	}else if(selector && selector.constructor == String){
		this.$ele = $(selector);
	}
}

$.extend(BreadCrumbs.prototype,{
	toHTML:function(){
		var arr = []
		this.crumbs.forEach(function(c,i,a){
			var $inner = $('<span>').html(c.name);
			if(i+1==a.length && i != 0){
				$inner = $('<a>').attr('href',c.link).html(c.name)
			}
			arr.push($('<li>').append($inner));
		});
		arr.unshift($('<li id="play">Play</li>').click(DE.play));
		
		return arr;
	},
	refresh:function(){
		this.$ele.empty().append(this.toHTML());
	},
	push:function(name,link) {
		this.length++;
		this.crumbs.push({name:name,link:link});
	},
	pop:function(){
		this.length--;
		return this.crumbs.pop();
	}
});

/*****************************
Extend Array Prototype 
*******************************/
if(!('findIndex' in Array.prototype)){
	Array.prototype.findIndex = function(callBack,thisArg){
		for(var i = 0; i<this.length; i++){
			if(callBack.call(thisArg,this[i],i,this))
				return i;
		}
		return -1;
	}

}


