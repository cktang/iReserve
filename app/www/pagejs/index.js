
var groups;

$(document).ready(function() {
	$('input.tags').tagsInput({width:'auto'});

	$('#addGroupButton').click(function(e) {
		$('#newGroup').modal().find('input')[0].focus();
	})

	$('#submitNewGroupButton').click(function(e) {
		var newGroup = new App.FormHandler({ el: $('#newGroupForm') }).serialize();
		groups.collection.push(newGroup);
		$('#newGroup').modal('hide');
		$('#newGroupForm')[0].reset();
	})

	groups = new App.CollectionView({
		collection: new App.GroupCollection,
		el: $('#groups'),
		listeners: [ new App.RemoveListener(), new App.LinkListener() ]  
	})
});