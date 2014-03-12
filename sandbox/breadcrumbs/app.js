
var site = {
	page:'Home',
	links:{
		'a':{
			page:'A',
			links:{
				'a1':{
					page:'a1',
					links:{
						'1':{page:'1'},
						'2':{page:'2'},
						'3':{page:'New'},
					}
				},
				'a2':{
					page:'a2',
					links:{
						'1':{page:'1'},
						'2':{page:'2'},
					}
				},
				'a3':{
					page:'a3',
					links:{
						'1':{page:'1'},
						'2':{page:'2'},
					}
				},
				
			}
		},
		'b':{
			page:'B',
			links:{
				'b1':{
					page:'b1',
					links:{
						'1':{page:'1'},
						'2':{page:'2'},
					}
				},
				'b2':{
					page:'b2',
					links:{
						'1':{page:'1'},
						'2':{page:'2'},
					}
				},
				'b3':{
					page:'b3',
					links:{
						'1':{page:'1'},
						'2':{page:'2'},
					}
				},
				
			}
		}
	}
}


var display = function(h1,h2,h3){
	var args = [];
	Array.prototype.forEach.call(arguments,function(i){if(i){args.push(i)}});
	var level = site, link = '#';
	
	if(args.length>=1) {
		level = level.links[h1];
		link += h1+'/';
	}
	if(args.length>=2) {
		level = level.links[h2];
		link += h2+'/';
	}
	if(args.length>=3) {
		level = level.links[h3];
		link += h3+'/';
	}
	
	if(args.length+1 < crumbs.length){
		while(args.length+1 < crumbs.length){
			crumbs.pop();
		}
		crumbs.refresh();
	}else if (args.length+1 > crumbs.length){
		console.log('Arg Push');
		crumbs.push(level.page,link);
		crumbs.refresh();
	}
	
	$('#display').empty().append(get_links(args,link));
	
}

var get_links = function(args,base){
	var links = site.links;

	if(args.length>=1){
		links = links[args[0]].links;
	}
	if(args.length>=2){
		links = links[args[1]].links;
	}
	if(args.length>=3){
		links = null;
	}
	
	if(links){
		var out = [];
		$.each(links,function(key,l){
			out.push(
				$('<li>')
				.append($('<a>').attr('href',base+key).html(l.page))
			);
		});
		return out;
	}else{
		return $('<span>').html('Leaf Node');
	}
}

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
		this.crumbs.forEach(function(c){
			var $a = $('<a>').attr('href',c.link).html(c.name)
			arr.push($('<li>').append($a));
		});
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


var crumbs;
$('document').ready(function(){
	crumbs = new BreadCrumbs('.breadcrumb',{name:'Home',link:'#'});
	routie({
		':h1?/:h2?/:h3?':function(h1,h2,h3){
			display(h1,h2,h3);
		},
	});
	crumbs.refresh();
});

