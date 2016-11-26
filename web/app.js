(function() {
	"use strict";
	angular.module("adminApp", []);
	angular.module("adminApp")
	.controller("dashboardCtrl", function($scope, bugSrv) {
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
		});

		function getRecord(bugs) {

			var buggyPeriods = mergeRanges(_.map(bugs, function(bug) {
				return [bug.detected.toDate(), (bug.corrected || moment().startOf("day")).toDate()]
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
			return _.where(bugs, { corrected: undefined }).length;
		}
		function getCurrent(bugs) {
			// _.chain(bugs)
			// .sortBy()
			return 0;
		}
	})
	.service("bugSrv", function($q) {
		function getbugs() {
			var dfd = $q.defer();
			dfd.resolve(spoofbugs);
			return dfd.promise;
		}
		return {
			getbugs: getbugs,
		};
	})


	var spoofbugs = [
		{ detected: moment("2016-10-01"), corrected: moment("2016-10-29"), },
		{ detected: moment("2016-11-01"), corrected: moment("2016-11-01"), },
		// { detected: moment("2016-11-14"), corrected: undefined, },
	];

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