
var people, activity, activityView, editContact;
$(document).ready(function() {
	people = new App.CollectionView({ 
		collection: new App.PeopleInActivityCollection() , 
		el: $('#peopleList'),
		listeners: [ new App.ExpandListener(), new App.AttendenceButtonListener(), new App.ReportButtonListener() ]  
	});

	activity = new App.Activity();

	activityView = new App.ModelView({
		model: activity,
		el: $('#stats'),
		listeners: []
		// listeners: [ new App.EditButtonListener() ]
	});

	$('#editPersonSaveButton').click(function(e) {
		editContact.save();
	});
});
