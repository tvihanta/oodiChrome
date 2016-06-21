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



	var strategies = [ //for web-oodi format multiple dates
		function(pSel){
			try {
			  var parts = pSel.replace(/\s+/g, " ").split(" "); var time = moment(parts[0]);
				var format = "D.M.YY HH.mm";

        var items = [];
				for (var i = 0, len=parts.length; i < len; i=i+4) {
					var obj = {}
					obj.startDatetime = moment(parts[i] +" "+parts[i+2].split("-")[0], format)
					obj.endDatetime = moment(parts[i] +" "+parts[i+2].split("-")[1],format)
					obj.location = parts[i+3]
	        items.push(obj);
				}
				return items;
			} catch (e) {
				console.log("errori");
        throw "homo";
			}
  	},

  ]

  function handleSelectedText(pselText) {
		var selectedText = pselText; //
  	$('#selection').val(pselText); var result;
    for (var i=0, len=strategies.length; i < len; i++) {
			try {
				result = strategies[i](selectedText);
				break;
			} catch (e) {
				console.log("error in strategy " + i);
			}
		}
    return result;
 }


	return {
		selection:getSelection()
	};
}]);
