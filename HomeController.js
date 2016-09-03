// HomeController.js
// For distribution, all controllers
// are concatanated into single app.js file
// by using Gulp

'use strict';

angular.module('mostPopularListingsApp.home', ['ngRoute'])

// Routing configuration for this module
.config(['$routeProvider',function($routeprovider){
	$routeprovider.when('/', {
		controller: 'HomeController',
		templateUrl: 'homeView.html'
	});
}])

// Controller definition for this module
.controller('HomeController', ['$scope', 'event', function($scope, event) {


	var that = this;
	init();
	//populate selection
	event.selection.then(function(pSelection){
		console.log(pSelection.items);
		$scope.selection = pSelection.selection;
		$scope.events = pSelection.items;

	});

	function init(){

	};
	$scope.message = "Hello Home!";
	$scope.options = {
		 minDate: new Date(),
		 showWeeks: true
	 };

	 $scope.datePicker = (function () {
			 var method = {};
			 method.instances = [];

			 method.open = function ($event, instance) {
					 $event.preventDefault();
					 $event.stopPropagation();

					 method.instances[instance] = !method.instances[instance];

			 };

			 method.options = {
					 'show-weeks': false,
					 startingDay: 0
			 };

			 var formats = ['MM/dd/yyyy', 'dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
			 method.format = formats[0];

			 return method;
	 }());


}])
.factory('event', [ '$q', function($q) {
	function getSelection(){
		var deferred = $q.defer();
		var items = null;
		chrome.extension.sendMessage({ msg: "getSelection"}, function(response){
			var selection = response.selection;
			items = handleSelectedText(selection);
			deferred.resolve({
				selection: response.selection,
				items: items
			});
		});

		return deferred.promise;
	}



	


	return {
		selection:getSelection()
	};
}]);
