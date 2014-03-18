
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




