App.Listener = Backbone.View.extend({
	apply: function(element) {
		//to be overriden
	}
});

App.CheckboxTraceListener = Backbone.View.extend({
	apply: function(el, collection, model, view) {
		var self = view;
		$(el).find('[type=checkbox]').click(function(e) { 
			var going = $(e.delegateTarget).is(':checked');
			if (going) {
				self.goingList = _.union(self.goingList, model.id);
				self.notGoingList = _.difference(self.notGoingList, model.id);
			} else {
				self.goingList = _.difference(self.goingList, model.id);
				self.notGoingList = _.union(self.notGoingList, model.id);
			}
		});
	}
});

App.UpdatePeopleStatusListener = Backbone.View.extend({
	apply: function(el, collection, model, view) {
		if (!model) return;
		var m = _(activity.get('people')).where({ id: model.id })[0];

		//init internal list
		view.goingList = view.goingList || [];
		view.notGoingList = view.notGoingList || [];

		if (m) {
			view.goingList.push(m.id);

			$(el).find('[type=checkbox]').prop('checked', true);
			if (m.status == 'going') $(el).addClass('list-group-item-success');
			if (m.status == 'notgoing') $(el).addClass('list-group-item-danger');
		} else {
			view.notGoingList.push(model.id);
		}
	}
});

App.EditButtonListener = App.Listener.extend({
	apply: function(el, collection) {
		$(el).find('#editButton').click(function(e) { 
			$('#editPersonList').modal(true);

			if (!editContact) {
				editContact = new App.CollectionView({ 
					collection: new App.PeopleCollection() , 
					el: $('#allPeopleList'),
					listeners: [ new App.UpdatePeopleStatusListener(), new App.CheckboxTraceListener() ]  
				});

				editContact.save = function() {
					var idsToAdd = _.difference(this.goingList, _(activity.get('people')).pluck('id'))
					var pp = editContact.collection.filter(function(e) { return _(idsToAdd).contains(e.id) });
					pp = _(pp).map(function(e) { return e.toJSON(); })
					// console.log(pp);
					_(pp).each(function(p) { p.status = 'unknown'; })
					// people.collection.push(pp);

					// var originalList = _.difference(_(activity.get('people')).pluck('id'), this.notGoingList);
					// _(activity.get('people')).chain().pluck('id').intersection(this.notGoingList).value()
					var self = this;
					var pp2 = _(activity.get('people')).filter(function(e) { return _(self.notGoingList).contains(e.id) });
					// pp2 = _(pp2).map(function(e) { return e.toJSON(); })
					console.log(pp2);
					people.collection.add(pp);
					setTimeout(function() {
						people.collection.remove(pp2);
					}, 2000);
				}
			} else {
				editContact.render();
			}
		});
	}
});

App.RemoveListener = App.Listener.extend({
	apply: function(el, collection, model) {
		$(el).find('.removeButton').on('click', function(e) {
			e.stopPropagation();
			if (!confirm('delete??')) return;
			model && collection.remove(model);
		});
	}
});

App.ReportButtonListener = App.Listener.extend({
	apply: function(el, collection, model) {
		$(el).find('.reportButton').on('click', function(e) {
			e.stopPropagation();
			var newRemark = prompt("Remark?", model.get('remark') || "");
			newRemark && model.set('remark', newRemark);
		});
	}
});

App.AttendenceButtonListener = App.Listener.extend({
	apply: function(el, collection, model) {
		$(el).find('.attendanceButtons').find('.btn').on('click', function(e) {
			e.stopPropagation();
			var newStatus = 
				$(e.delegateTarget).hasClass('btn-success')? "going":
				$(e.delegateTarget).hasClass('btn-danger')? "notgoing":
				"unknown";
			model && model.set('status', newStatus);
		});
	}
});

App.ExpandListener = App.Listener.extend({
	apply: function(el, collection) {
		$(el).on('click', function(e) {
			e.stopPropagation();
			$(e.delegateTarget).find('.content').toggle('slide');
		});
	}
});

App.LinkListener = App.Listener.extend({
	apply: function(el, collection) {
		$(el).on('click', function(e) {
			e.stopPropagation();
			App.save($(el).attr('data-id-type') + '-id', $(el).attr('data-id'));
			if ($(el).attr('data-target')) location.href=$(el).attr('data-target');
		});
	}
});

App.ContactSelectListener = App.Listener.extend({
	apply: function(el, collection, model) {
		$(el).find('.contactSelectButton').on('click', function(e) {
			e.stopPropagation();
			var id = $(e.target).parents('[data-id]').attr('data-id');

			$('#activityContact').modal();

			var contacts = new App.CollectionView({ 
				collection: new App.PeopleCollection, 
				el: $('#contactSelect'),
				listeners: [ new App.YesOrNoListItemListener() ]  
			});

			contacts.on('rendered', function() {
				var peopleList = collection.get(id).get('people');
				_(peopleList).each(function(p, i) {
					$(contacts.el).find('[data-id='+p.id+']')
						.addClass('list-group-item-success')
				})
			})
		});
	}
});

App.YesOrNoListItemListener = App.Listener.extend({
	apply: function(el, collection, model) {
		$(el).find('.btn-success').on('click', function(e) {
			e.stopPropagation();
			$(e.target).parents('.list-group-item')
				.removeClass('list-group-item-danger')
				.addClass('list-group-item-success')
		});
		$(el).find('.btn-danger').on('click', function(e) {
			e.stopPropagation();
			$(e.target).parents('.list-group-item')
				.removeClass('list-group-item-success')
				.addClass('list-group-item-danger')
		});
	}
});
