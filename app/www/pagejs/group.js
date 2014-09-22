var activities, contacts, filterBox, duplicateBox, group;

function updateStats() {									
	setTimeout(function() {
		var sum = function(arr) { return _.reduce(arr, function(memo, num){ return memo + num; }, 0); }
		$('#totalGoing').html(sum(_($('.list-group-item .btn-success:visible')).map(function(e) { return parseInt($(e).text() || "0") })));
		$('#totalUnknown').html(sum(_($('.list-group-item .btn-default:visible')).map(function(e) { return parseInt($(e).text() || "0") })));
		$('#totalNotGoing').html(sum(_($('.list-group-item .btn-danger:visible')).map(function(e) { return parseInt($(e).text() || "0") })));
		$('#total').html(sum(_($('.list-group-item .btn-total:visible')).map(function(e) { return parseInt($(e).text() || "0") })));
	}, 1000);
}

$(document).ready(function() {
	$('input.tags').tagsInput({width:'auto'});

	$('#newActivity').find('[name=name]').on('keyup', function(e) {		
		$('#newActivity').find('[name=tags]').importTags($(e.delegateTarget).val().split(" ").join(","));
	});

	$('#addActivityButton').click(function(e) {
		$('#newActivity').modal().find('input')[0].focus();
	})
	$('#addContactButton').click(function(e) {
		$('#newContact').modal().find('input')[0].focus();
	})
	$('#contactButton').click(function(e) {
		$('#contactList').modal();
		if (!contacts) contacts = new App.CollectionView({ 
			collection: new App.PeopleCollection, 
			el: $('#contactsDiv'),
			listeners: [ new App.RemoveListener(), new App.LinkListener() ]  
		});
	})
	$('#submitNewActivityButton').click(function(e) {
		var newActivity = new App.FormHandler({ el: $('#newActivityForm') }).serialize();

		//duplicate people list
		if ($('#newActivityForm').find('[name=duplciateFrom]').val() != "") {
			var pp = activities.collection.findWhere({id: $('#newActivityForm').find('[name=duplciateFrom]').val()}).get('people');
			_(pp).each(function(p) { p.status = "unknown"; })
			newActivity.people = pp;
		}

		activities.collection.push(newActivity);
		$('#newActivity').modal('hide');
		$('#newActivityForm')[0].reset();
	})
	$('#submitNewContactButton').click(function(e) {
		contacts.collection.push(new App.FormHandler({ el: $('#newContactForm') }).serialize());
		$('#newContact').modal('hide');
		$('#newContactForm')[0].reset();
	})

	group = new App.ModelView({
		model: new App.Group, 
		el: $('#group')
	});

	activities = new App.CollectionView({ 
		collection: new App.ActivityCollection, 
		el: $('#activities'),
		listeners: [ new App.RemoveListener(), new App.LinkListener() ]  
	});

	activities.on('changed', function() {
		//duplicatebox
		if (duplicateBox) duplicateBox.render(beans);
		else {
			duplicateBox = new App.SelectView({
				el: $('#duplciateFromDiv'),
				beans: activities.collection.pluck('id'),
				pairs: _.object(activities.collection.pluck('id'), activities.collection.pluck('name')),
				name: 'duplciateFrom',
				addEmpty: true,
				map: function(val) {
					return this.options.pairs[val];
				}
			});

			duplicateBox.on('changed', function(value) {
				console.log(value);
			})
		}

		updateStats();
	})

});