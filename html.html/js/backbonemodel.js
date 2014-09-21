App = { 
	Mixins: {},
	savePrefix: 'silly-',
	local: localStorage,
	access: function(name) { return App.local[App.savePrefix + name] || ''; },
	save: function(name, value) { App.local[App.savePrefix + name] = value; }
};

//Utility
App.FormHandler = Backbone.View.extend({
	serialize: function() {
		return this.el && _($(this.el).serializeArray()).chain().map(function(e) { return _(e).values(); }).object().value()
	}
});
//Utility End

// Handlebar mixin start
Handlebars.registerHelper('filter', function(list, options) {
  if (options.hash.status == "--any--") return new Handlebars.SafeString(_(list).keys().length);
  return new Handlebars.SafeString(_(list).where(options.hash).length);
});

Handlebars.registerHelper('printStatus', function(object) {
  return new Handlebars.SafeString(object.status == "going"? "success": object.status == "notgoing"? "danger" : "default" );
});

App.Mixins.HandlebarModelRenderer = {
	render: function() {
		if (!this.el || (!this.collection && !this.model)) return;
		var self = this;

		//clear screen
		$(this.el).find('*').not('script.template').empty().remove();

		this.collection && this.collection.each(function(model, i) {
			self.renderModel(self.el, model)
		});

		this.model && this.renderModel(this.el, this.model);

		this.trigger('rendered');
	},

	renderModel: function(container, model) {
		var existingEl = $(container).find('[data-id=' + model.id + ']')[0];
		var el = this.realRenderModel(container, model, existingEl);
		$(el).find('.hide').removeClass('hide').hide();
		this.registerListeners(el);	
		this.handleEmpty();
		return el;
	},
	
	realRenderModel: function(container, model, el) {
		if ($(container).find('script.template').length == 0) return;
		this.template = this.template || Handlebars.compile($(container).find('script.template').html());

		if (el && this.template) {
			var newEl = $(this.template(model.toJSON())).insertAfter($(el)).hide().show('fade');
			$(el).remove();
			return newEl;
		} else {
			return this.template && $(this.template(model.toJSON())).appendTo($(container)).hide().show('fade');
		}
	},

	showModel: function(container, model) {
		$(container).find('[data-id=' + model.id + ']').show("fade");
	},

	hideModel: function(container, model) {
		$(container).find('[data-id=' + model.id + ']').hide("fade");
	},

	removeModel: function(container, model) {
		$(container).find('[data-id=' + model.id + ']').remove();
		this.handleEmpty();
	},

	handleEmpty: function() {
		$(this.el).find('#noactivity').remove();
		if (this.collection && this.collection.length == 0) {
			$(this.el).append("<div id=noactivity class=well>No Record</div>")
		}
	},

	filter: function(fits) {
		var self = this;
		this.collection.each(function(e, i) {
			if (fits(e)) self.showModel(self.el, e);
			else self.hideModel(self.el, e);
		})
	}
};
// Handlebar mixin end

App.CollectionView = Backbone.View.extend(
	_.extend( App.Mixins.HandlebarModelRenderer, {

	initialize: function(options) {
		this.options = options || {};
		this.collection.on('all', this.handlChange, this);
	},

	handlChange: function(action, model) {		
		console.log("collection change: " + action);
		if (_(['sync']).contains(action)) {
			this.synced = true;
			this.render();
		}
		if (!this.synced) return;
		if (_(['add']).contains(action)) this.render();
		if (_(['remove']).contains(action)) this.removeModel(this.el, model);
		if (action.indexOf('change:') >= 0) this.renderModel(this.el, model).show('pulsate');

		this.trigger('changed');
	},

	registerListeners: function(element) {
		if (!this.options.listeners) return;
		var self = this;
		_(this.options.listeners).each(function(listener) {
			listener.apply && listener.apply(element, self.collection, 
				self.model || (self.collection && self.collection.where({ id: $(element).attr('data-id') })[0]),
				self
			);
		})
	}
}));

App.ModelView = Backbone.View.extend(
	_.extend( App.Mixins.HandlebarModelRenderer, {

	initialize: function(options) {
		this.options = options || {};
		this.model.on('all', this.handlChange, this);
	},

	handlChange: function(action) {
		console.log("model change: " + action);
		if (_(['sync']).contains(action)) this.render();
	}
}));

App.SelectView = Backbone.View.extend({

	initialize: function(options) {
		this.options = options;
		if (this.options.map) this.map = this.options.map;
		this.render(this.options.beans);
	},

	//to be overridden by custom select box mappings
	map: function(val) { return val; },

  	events: {
  		'change select': function(e) { this.trigger('changed', $(e.target).val()); }
  	},

	render: function(beans) {
		if (!beans) return;

		var comboBox = $('<select class=form-control name="'+this.options.name+'"></select>');
		if (this.options.addEmpty) $(comboBox).append('<option value=""></option>');

		var self = this;
		_(beans).each(function(e, i) {
			$(comboBox).append('<option value="'+e+'">'+self.map(e)+'</option>');
		});

		$(this.el).empty().append(comboBox);
		this.trigger('rendered');
		return this;
	}
});

