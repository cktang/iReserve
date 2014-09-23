	
Date.prototype.yyyymmdd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
};

_.templateSettings = {
	interpolate : /\{\{(.+?)\}\}/g
};

window.App = {};

App.Mixins = {}

App.Mixins.Formatter = {
  format: function(num, f) {
  	try {
	    f = f || "0000";
	    return $.formatNumber(num, {format:f});
	}catch(e) {}
	return num;
  },
}

App.Mixins.Utilities = {

	//log level: 0=DEBUG, 1=INFO, 2=ERROR
	logLevel: 1,

	logInfo: function(msg) { 
		try {
			if (this.logLevel > 1) return;
			console.log("Info: " + msg);
		}catch(e) {}
	},

	logDebug: function(msg) { 
		try {
			if (this.logLevel > 0) return;
			console.trace("Debug: " + msg);
		}catch(e) {}
	},

	logError: function(msg) { 
		try {
			if (this.logLevel > 2) return;
			console.error("Error: " + msg);
		}catch(e) {}
	}
}

//allow manually inject bean
App.Mixins.BeanInjection = {
	injectBeans: function(beans) {
		this.logDebug('BeanInjection.injectBeans()');
		this.beans = beans;
		this.trigger('injectBeanCompleted', this.beans);
		return this;
	}
};

//add SQL fetch functionalities
App.Mixins.DirectSQLFetch = {
	//define SQL url
	baseURL: "../index.php/api/sqlquery",

	fetchSQL: function(sql) {
		this.logDebug('DirectSQLFetch::fetchSQL()');
		var self = this;
		$.ajax({
			url: this.baseURL,
			data: { sql: sql },
			type: 'POST'	
		}).success(function(data) {
			self.logDebug('SQL Result: ' + data);
			try {
				self.beans = JSON.parse(data);
				self.beans = self.afterSQLFetch(self.beans);
				self.trigger('SQLFetchCompleted', self.beans);
			}catch(e) {
				self.logError('Error parsing: ' + data + '|' + e);
				self.trigger('SQLFetchError', data);
			}
		});
	},	

	//default implementation, to be overloaded
	afterSQLFetch: function(beans) {
		return beans;
	},

	autoFetch: function(params) { 
		this.fetchSQL(_.template(this.sqlTemplate)(params || {})); 
	}
};

App.BaseView = Backbone.View.extend(
	  _.extend({}, 
  	App.Mixins.Utilities, {
}));

App.SelectView = Backbone.View.extend(
	  _.extend({}, 
  	App.Mixins.DirectSQLFetch, 
  	App.Mixins.BeanInjection, 
  	App.Mixins.Utilities, {

	initialize: function(options) {
		this.logDebug('App.SelectView.initialize()');
		this.on('SQLFetchCompleted', this.renderComboBox, this);
		this.on('injectBeanCompleted', this.renderComboBox, this);

		if (options.name) {
			this.name = options.name;
		} else {
			this.logError('SelectView name attribute missing');
		}
	},

	//to be overridden by custom select box mappings
	map: function(val) {
		return val;
	},

  	events: {
  		'change select': function(e) { this.trigger('changed', $(e.target).val()); }
  	},

	renderComboBox: function(beans) {
		this.logInfo('ComboView.renderComboBox()');

		this.logDebug(JSON.stringify(beans));
		var comboBox = $('<select name="'+this.name+'"></select>');

		if (this.options.addEmpty) {
			$(comboBox).append('<option value=""></option>');
		}

		var self = this;
		beans = 
			!_.isArray(beans)?
				_.chain(beans).map(function(e) { return _(e).values(); }).flatten().value():
				beans;
		_(beans).each(function(e, i) {
			self.logDebug(e);
			$(comboBox).append('<option value="'+e+'">'+self.map(e)+'</option>');
		});

		$(this.el).empty().append(comboBox);
		this.trigger('rendered');
		return this;
	}

}));

App.TableRow = new Object({
	content: function(bean) { return bean[this.name] || '/'; }
});

App.ListView = Backbone.View.extend(
  _.extend({}, 
  	App.Mixins.DirectSQLFetch, 
  	App.Mixins.Utilities, {

  	//default no action init, to be used by overriders
  	init: function() {},

  	rowTemplate: "<li>{{content}}</li>",

	initialize: function(options) {
		this.on('SQLFetchCompleted', this.renderList, this);
		this.init();
	},

	renderList: function(beans) {
		this.logInfo('TableView.renderHeader()');
		if (!beans || beans.length == 0) return;

		var ul = $('<ul></ul>');

		//print limited rows
		var self = this;
		_(beans).each(function(bean, i) {
			$(ul).append("<li>"+_.template(self.rowTemplate)(bean)+"</li>");
		});

		$(this.el).append(ul);
		this.trigger('renderListFinished');
		this.trigger('rendered');
	}
}));


App.QuickTableView = Backbone.View.extend(
  _.extend({}, 
  	App.Mixins.DirectSQLFetch, 
  	App.Mixins.BeanInjection, 
  	App.Mixins.Utilities, {

  	MAX_COLUMNS: 15,
  	MAX_ROWS: 100000,

	initialize: function(options) {
		this.on('SQLFetchCompleted', this.renderHeader, this);
		this.on('SQLFetchCompleted', this.renderBody, this);
		this.on('injectBeanCompleted', this.renderHeader, this);
		this.on('injectBeanCompleted', this.renderBody, this);
	},

	renderHeader: function(beans) {
		this.logInfo('TableView.renderHeader()');
		if (!beans || beans.length == 0) {
			$(this.el).append("<tr><th>No Record.</th></tr>");
			this.trigger('rendered');
			return;  
		}

		//for handling SQLResult object
		if (beans.headers) {
			beans = beans.headers;
		} else {
			beans = _.keys(beans[0]);
		}

		var header = this.$('thead');
		if (!header || header.length == 0) {
			$(this.el).append("<thead></thead>");
			header = this.$('thead');
		}

		//clean previous results
		$(header).empty();

		var self = this;
		var tr = $('<tr></tr>');
		var keys = beans;
		_(keys).each(function(e, i) {
			self.logDebug(i + ": " + e);

			//print limited columns
			if (i < self.MAX_COLUMNS) {
				$(tr).append("<th>"+e+"</th>");
			}
		});

		$(header).append(tr);
	},

	renderBody: function(beans) {
		this.logInfo('TableView.renderBody()');

		//for handling SQLResult objects
		if (beans.rows) {
			beans = beans.rows;
		}

		if (!beans || beans.length == 0) return;
 
		var body = this.$('tbody');
		if (!body || body.length == 0) {
			$(this.el).append("<tbody></tbody>");
			body = this.$('tbody');
		}

		//clean previous results
		$(body).empty();

		var self = this;
		var trs = new Array;

		//print limited rows
		_(this.MAX_ROWS).times(function(count) {
			var tr = $('<tr></tr>');
			if (!beans[count]) return;

			var keys = _.values(beans[count]);
			_(keys).each(function(e, i) {
				self.logDebug(i + ": " + e);

				//print limited columns
				if (i < self.MAX_COLUMNS) {
					$(tr).append("<td>"+e+"</td>");
				}
			});
			trs.push(tr);
		});		
		$(body).append(trs);
		this.trigger('rendered');
	}
}));


App.TableView = Backbone.View.extend(
  _.extend({}, 
  	App.Mixins.DirectSQLFetch, 
  	App.Mixins.BeanInjection, 
  	App.Mixins.Utilities, {

  	fields: {},

  	//default no action init, to be used by overriders
  	init: function() {

  	},

	initialize: function(options) {
		this.on('SQLFetchCompleted', this.renderHeader, this);
		this.on('SQLFetchCompleted', this.renderBody, this);
		this.on('injectBeanCompleted', this.renderHeader, this);
		this.on('injectBeanCompleted', this.renderBody, this);

		if (options) {
			if (options.fields) this.fields = options.fields;
		}
		this.init();
	}, 

	renderHeader: function(beans) {
		this.logInfo('TableView.renderHeader()');
		if (!beans || beans.length == 0) return;

		var header = this.$('thead');
		if (!header || header.length == 0) {
			$(this.el).append("<thead></thead>");
			header = this.$('thead');
		}

		//clean previous results
		$(header).empty();

		var self = this;
		var tr = $('<tr></tr>');

		_(this.fields).each(function(e, i) {
			$(tr).append("<th>"+e.header+"</th>");
		});

		$(header).append(tr);
		this.trigger('renderHeaderFinished');
	},

	//to be overridden if there're specific row rules
	renderRow: function(bean) {
		this.logDebug('TableView.renderRow()');
		return $('<tr></tr>');
	},

	renderBody: function(beans) {
		this.logInfo('TableView.renderBody()');

		if (!beans || beans.length == 0) return;

		var body = this.$('tbody');
		if (!body || body.length == 0) {
			$(this.el).append("<tbody></tbody>");
			body = this.$('tbody');
		}

		//clean previous results
		$(body).empty();

		var self = this;

		//print limited rows
		_(beans).each(function(bean, i) {
			var tr = self.renderRow(bean);
			_(self.fields).each(function(e, i) {
				$(tr).append("<td>"+e.content(bean)+"</td>");
			});
			$(body).append(tr);
		});

		this.trigger('renderBodyFinished');
		this.trigger('rendered');
	}
}));

App.Websocket = Backbone.View.extend(
    _.extend({}, 
    App.Mixins.Utilities, {
  ip: "",
  port: "",
  ws: null,

  initialize: function(options) {
    this.ip = options.ip || this.ip;
    this.port = options.port || this.port;
    this.wsString = 'ws://'+this.ip+':'+this.port;
    this.timer = null;
    this.isConnected = false;

  	var self = this;		
	self.isActive = true;
	window.addEventListener('focus', function() {
		self.isActive = true;
	});

	window.addEventListener('blur', function() {
		self.isActive = false;
	});			

    this.init();
  },

  onmessage: function(evt) {  
    if (!evt.data) return;
    var msg = evt.data;
    //this.wrapper.logInfo('result: ' + msg);
    msg = JSON.parse(msg);
    this.wrapper.msgCallback(msg);
  },

  onclose: function() {   
    this.wrapper.logInfo("Lost Connection, retry in 5s");  
    clearTimeout(this.timer);
    this.timer = setTimeout($.proxy(this.wrapper.connect, this.wrapper), 5000);
    this.wrapper.isConnected = false;
  },

  onerror: function(evt){  
    this.wrapper.logInfo("Error: "+evt.data, "negative, retry in 5s");  
    clearTimeout(this.timer);
    this.timer = setTimeout($.proxy(this.wrapper.connect, this.wrapper), 5000);
  },

  onopen: function(evt) {   
    this.wrapper.logInfo("Connection Established"); 
    this.wrapper.isConnected = true;
    this.wrapper.onConnect(evt); 
  },

  /*********** user extend area ***********/
  init: function() {

  },

  onConnect: function(evt) {
    this.logInfo("OnConnect: " + evt);
  },

  msgCallback: function(msg) {
    this.logInfo("msgCallback: " + msg);
  },
  /*********** user extend area ***********/

  connect: function() {   
    var self = this;

    try {
      self.logInfo("connecting: " + this.wsString);
      this.ws = null;    
      this.ws = new WebSocket(this.wsString);   
      this.ws.wrapper = self;
      this.ws.onmessage = this.onmessage;
      this.ws.onclose = this.onclose;
      this.ws.onerror = this.onerror;
      this.ws.onopen = this.onopen;
    }catch(e) {
      self.logError("Error: " + e);
      //this.ws = null;
    }   
  },

  sendMsg: function(msg) {
    if (this.ws == null) return;
    msg = JSON.stringify(msg);
    this.logInfo("Sending: " + msg);     
    this.ws.send(msg);
  }   
}));


App.QuickTableArrayView = Backbone.View.extend(
  _.extend({}, 
  	App.Mixins.WebSocketFetch, 
  	App.Mixins.BeanInjection, 
  	App.Mixins.Utilities, {

  	MAX_COLUMNS: 20,
  	MAX_ROWS: 10000,

	initialize: function(options) {
		this.on('FetchCompleted', this.renderHeader, this);
		this.on('FetchCompleted', this.renderBody, this);
		this.on('injectBeanCompleted', this.renderHeader, this);
		this.on('injectBeanCompleted', this.renderBody, this);
	},

	renderHeader: function(sqlResult) {
		this.logInfo('TableView.renderHeader()');
		//if (!beans || beans.length == 0) return;

		$(this.el).empty();

		var header = this.$('thead');
		if (!header || header.length == 0) {
			$(this.el).append("<thead></thead>");
			header = this.$('thead');
		}

		//clean previous results
		$(header).empty();

		var self = this;
		var tr = $('<tr></tr>');
		var keys = sqlResult.headers;
		_(keys).each(function(e, i) {
			self.logDebug(i + ": " + e);

			//print limited columns
			if (i < self.MAX_COLUMNS) {
				$(tr).append("<th>"+e+"</th>");
			}
		});

		$(header).append(tr);
	},

	renderBody: function(sqlResult) {
		this.logInfo('TableView.renderBody()');

		var body = this.$('tbody');
		if (!body || body.length == 0) {
			$(this.el).append("<tbody></tbody>");
			body = this.$('tbody');
		}

		//clean previous results
		$(body).empty();

		var self = this;

		if (!sqlResult.rows || sqlResult.rows.length == 0) return;

		//print limited rows
		_(this.MAX_ROWS).times(function(count) {
			var tr = $('<tr></tr>');
			var keys = _.values(sqlResult.rows[count]);
			_(keys).each(function(e, i) {
				self.logDebug(i + ": " + e);

				//print limited columns
				if (i < self.MAX_COLUMNS) {
					$(tr).append("<td>"+self.format(e, 
						_.contains(['Underlying', 'Code'], sqlResult.headers[i])?
							"0000":"#,##0.##")+"</td>");
				}
			});
			$(body).append(tr);
		});		
		this.trigger('rendered');
	}
}));


App.GroupTableArrayView = App.QuickTableArrayView.extend({ 
	renderHeader: function() {
		this.logInfo('TableView.renderHeader()');
		//if (!beans || beans.length == 0) return;

		$(this.el).empty();

		var header = this.$('thead');
		if (!header || header.length == 0) {
			$(this.el).append("<thead></thead>");
			header = this.$('thead');
		} 

		//clean previous results
		$(header).empty();

		var r = r||0;
		var c = c||1;
		var v = v||2;
		console.log('groupReport('+r+','+c+','+v+')');

		var rows = _(this.beans.rows).chain().pluck(r).uniq().sort().value();
		var cols =  _(this.beans.rows).chain().pluck(c).uniq().sort().value();
		var values = _(this.beans.rows).groupBy(function(row) { return row[r]+"|"+row[c]; });

		var tr = $('<tr></tr>').append("<th></th>" + _(cols)
			.chain()
			.map(function(col) { return "<th>" + col + "</th>"; })
			.value()
			.join(""));
		$(tr).append('<th>Total</th>');
		$(header).append(tr);
	},

	renderBody: function() {
		this.groupReport();
	},

	groupReport: function(r, c, v) {
		r = r||0;
		c = c||1;
		v = v||$('[name=column]').val()||2;
		console.log('groupReport('+r+','+c+','+v+')');

		var rows = _(this.beans.rows).chain().pluck(r).uniq().sort().value();
		var cols =  _(this.beans.rows).chain().pluck(c).uniq().sort().value();
		if (this.colSorter) cols = _(cols).sortBy(this.colSorter);

		var values = _(this.beans.rows).groupBy(function(row) { return row[r]+"|"+row[c]; });

		var table = $('<table class="table table-condensed"></table>');
		var header = $('<tr></tr>').append("<th></th>" + _(cols)
			.chain()
			.map(function(col) { return "<th>" + col + "</th>"; })
			.value()
			.join(""));
		$(header).append('<th>Total</th>');
		$(table).append($('<thead></thead>').append(header));

		var colTotals = {};
		_(rows).each(function(row,i) {
			var rowTotal = 0;
			var tr = $('<tr></tr>').append("<th>"+row+"</th>"); 
			_(cols).each(function(col, ii) { 
				var value = values[row+"|"+col]? _.sum(_(values[row+"|"+col]).pluck(v)): null;
				rowTotal += value || 0;
				colTotals[col] = (colTotals[col]||0) + (value||0);

				//try to format
				// value = (self.formatCell && self.formatCell(value)) || value || ""; 
				$(tr).append("<td>"+(value || "")+"</td>");
			});
			$(tr).append('<th class=summary style="text-align:right">'+ rowTotal +'</th>');
			$(table).append(tr);
		});

		//tfoot
		var tr = $('<tr></tr>').append('<th></th>');
		_(_(colTotals).keys()).each(function(e,i) {
			$(tr).append('<th class=summary>'+colTotals[e]+'</th>');
		});
		$(tr).append('<th class=summary>'+_.sum(colTotals)+'</th>');
		$(table).append($('<tfoot></tfoot>').append(tr)); 

		_($(table).find('th.summary, td')).each(function(e,i) {
			if ($(e).html().length > 0) $(e).html($.formatNumber($(e).text(), {format:'#,##0'}));
		});
		
		$('.results').empty().append(table).show('fade');
	}

});
 

App.CollectionView = Backbone.View.extend(
  _.extend({}, 
  	App.Mixins.WebSocketFetch, 
  	App.Mixins.BeanInjection, 
  	App.Mixins.Utilities, {

  	MAX_COLUMNS: 20,
  	MAX_ROWS: 10000,

	initialize: function(options) {
		this.on('FetchCompleted', this.renderHeader, this);
		this.on('FetchCompleted', this.renderBody, this);
		this.on('injectBeanCompleted', this.renderHeader, this);
		this.on('injectBeanCompleted', this.renderBody, this);
	},

	renderHeader: function() {
		this.logInfo('CollectionView.renderHeader()');
		if (this.beans.length == 0) return;

		$(this.el).empty();

		var header = this.$('thead');
		if (!header || header.length == 0) {
			$(this.el).append("<thead></thead>");
			header = this.$('thead');
		}

		//clean previous results
		$(header).empty();

		var self = this;
		var tr = $('<tr></tr>');
		var keys = _(this.beans[0].toJSON()).keys();
		_(keys).each(function(e, i) {
			self.logDebug(i + ": " + e);
			$(tr).append("<th>"+e+"</th>");
		});

		$(header).append(tr);
	},

	renderBody: function() {
		this.logInfo('CollectionView.renderBody()');
		if (this.beans.length == 0) return;

		var body = this.$('tbody');
		if (!body || body.length == 0) {
			$(this.el).append("<tbody></tbody>");
			body = this.$('tbody');
		}

		//clean previous results
		$(body).empty();

		var self = this;

		var keys = _(this.beans[0].toJSON()).keys();

		_(this.beans).each(function(e, i) {
			var tr = $('<tr></tr>');
			_(keys).each(function(key, i) {
				self.logDebug(i + ": " + e);
				$(tr).append("<td>"+e.get(key)+"</td>");
			});
			$(body).append(tr);
		});
		this.trigger('rendered');
	}
}));
