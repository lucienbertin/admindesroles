(function() {
	"use strict";
	angular.module("adminApp", ["firebase"]);

	angular.module("adminApp")
	.controller("dashboardCtrl", function($scope, bugSrv, $firebaseAuth) {
		$scope.record = 0;
		$scope.current = 0;
		$scope.pending = 0;
		bugSrv.getbugs()
		.then(function(bugs) {
			$scope.record = getRecord(bugs);
			$scope.pending = getPending(bugs);
			if (!$scope.pending) {
				$scope.current = getCurrent(bugs);
			} else {
				$scope.current = 0;
			}
			if ($scope.current > $scope.record) {
				$scope.record = $scope.current;
			}
			$scope.$apply();
		});

		function getRecord(bugs) {

			var buggyPeriods = mergeRanges(_.map(bugs, function(bug) {
				return [moment(bug.detected).startOf("day").toDate(), moment(bug.corrected).startOf("day").toDate()];
			}));
			var record = 0;
			_.reduce(buggyPeriods, function(memo, p) {
				var days = moment.duration(moment(p[0]).diff(memo[1])).asDays();
				record = Math.max(record, days);
				return p;
			})
			return Math.floor(record);
		}
		function getPending(bugs) {
			return _.filter(bugs, function(bug) { return !bug.corrected; }).length;
		}
		function getCurrent(bugs) {
			var lastCorrection = _.chain(bugs)
			.sortBy("corrected")
			.last()
			.value().corrected;
			return Math.floor(moment.duration(moment().diff(lastCorrection)).asDays());
		}
	});

	angular.module("adminApp")
	.service("bugSrv", function($q, $firebaseArray) {
		function getbugs() {
			var bugs = firebase.database().ref("bugs");
			return bugs.once("value")
			.then(function(snapshot) {
				return snapshot.val();
			});
		}
		return {
			getbugs: getbugs,
		};
	})

	// var spoofbugs = [
	// 	{ detected:"2016-10-01", corrected: "2016-10-29", },
	// 	{ detected: "2016-11-01", corrected: "2016-11-01", },
	// 	{ detected: "2016-11-14" },
	// ];
	// firebase.database().ref("bugs").set(spoofbugs);

	// copy pasted from https://github.com/jwarby/merge-ranges/
	function mergeRanges(ranges) {
		if (!(ranges && ranges.length)) {
			return [];
		}

		// Stack of final ranges
		var stack = [];

		// Sort according to start value
		ranges.sort(function(a, b) {
			return a[0] - b[0];
		});

		// Add first range to stack
		stack.push(ranges[0]);

		ranges.slice(1).forEach(function(range, i) {
			var top = stack[stack.length - 1];

			if (top[1] < range[0]) {

				// No overlap, push range onto stack
				stack.push(range);
			} else if (top[1] < range[1]) {

				// Update previous range
				top[1] = range[1];
			}
		});

		return stack;
	};
})();