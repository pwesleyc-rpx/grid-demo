
(() => {
	angular.module('insight')
	.controller('PatentGridController', PatentGridController)

	/* @ngInject */
	function PatentGridController($scope, uiGridConstants, $http) {

		const dateGridSorter = (a, b, rowA, rowB, direction) => {
			let nulls = $scope.grid2Api.core.sortHandleNulls(a, b);
			if(nulls !== null) { return nulls; }
	
			const aDate = new Date(a);
			const bDate = new Date(b);
	
			if(aDate < bDate) { return -1; }
			if(aDate > bDate) { return 1; }
			return 0;
		};

		const numGridFilter = (searchTerm, cellValue) => {
			const pattern = /^\s*(>|>\s*=|<|<\s*=|=)\s*(\d+|\d*\.\d+)\s*(?:(>|>\s*=|<|<\s*=|=)\s*(\d+|\d*\.\d+))?\s*$/;
			const result = searchTerm.match(pattern);

			const operations = {
				'>': (left, right) => left > right,
				'>=': (left, right) => left >= right,
				'<': (left, right) => left < right,
				'<=': (left, right) => left <= right,
				'=': (left, right) => left === right,
			};

			if(result) {
				let [, op1, v1, ...between] = result;
				let result = operations(op1.replace(/\s+/g, ''))(cellValue, parseInt(v1));

				if(between) {
					let [op1, v2] = between;
					return result && operations(op2.replace(/\s+/g, ''))(cellValue, parseInt(v2));
				}
				return result;
			} else {
				return cellValue === parseInt(searchTerm);
			}
		};

		const gridHeaders = {
			Patent: 'Pat#',
			Title: 'Title',
			TopicCluster: 'Topic Cluster',
			Score: 'Score',
			ShortestClaim: 'Length of Shortest Claim',
			CurrentAssignee: 'Current Assignee',
			IPC: 'IPC Class',
			Family: 'Patent Family',
			ForwardRefs: 'Forward Refs',
			BackwardRefs: 'Backward Refs',
			IssuedDate: 'Issue Date',
			FilingDate: 'Filing Date',
			PriorityDate: 'Priority Date',
			GrantTime: 'Grant Time',
			Continuances: 'Open Continuances',
			Defs: 'Defs'
		};

		const gridNumberFilter = {
			noTerm: true,
			condition: numGridFilter
		};

		$scope.grid = {
	    enableSorting: true,
	    enableFiltering: true,
	    columnDefs: [
	      { field: gridHeaders.Patent, },
	      { field: gridHeaders.Title, },
	      { field: gridHeaders.TopicCluster, },
	      { field: gridHeaders.Score, type: 'number', filter: gridNumberFilter },
	      { field: gridHeaders.ShortestClaim, type: 'number', filter: gridNumberFilter },
	      { field: gridHeaders.CurrentAssignee, },
	      { field: gridHeaders.IPC, },
	      { field: gridHeaders.Family, },
	      { field: gridHeaders.ForwardRefs, type: 'number', filter: gridNumberFilter },
	      { field: gridHeaders.BackwardRefs, type: 'number', filter: gridNumberFilter },
	      { field: gridHeaders.IssuedDate, type: 'string', sortingAlgorithm: dateGridSorter },
	      { field: gridHeaders.FilingDate, type: 'string', sortingAlgorithm: dateGridSorter },
	      { field: gridHeaders.PriorityDate, type: 'string', sortingAlgorithm: dateGridSorter },
	      { field: gridHeaders.GrantTime, type: 'number', filter: gridNumberFilter },
	      { field: gridHeaders.Continuances, type: 'number', filter: gridNumberFilter },
	      { field: gridHeaders.Defs, type: 'number', filter: gridNumberFilter },
	    ],
	    onRegisterApi: function( gridApi ) {
	      $scope.gridApi = gridApi;
	    },
	    data: []
	  };

	  const fillPatentGrid = (data) => {
	  	data.map((d) => {
		    let {
		    	patnum, title, topic_cluster, overall_score, length_of_shortest_claim,
		    	current_assignee, ipc_class, patent_family, forward_refs, backward_refs,
		    	issue_date, app_filing_date, priority_date, grant_time, open_continuances,
		    	count_of_defendants
		    } = d;
		    return {
					[gridHeaders.Patent]: patnum,
					[gridHeaders.Title]: title,
					[gridHeaders.TopicCluster]: topic_cluster,
					[gridHeaders.Score]: +overall_score, 
					[gridHeaders.ShortestClaim]: +length_of_shortest_claim,
					[gridHeaders.CurrentAssignee]: current_assignee,
					[gridHeaders.IPC]: ipc_class,
					[gridHeaders.Family]: patent_family, 
					[gridHeaders.ForwardRefs]: +forward_refs, 
					[gridHeaders.BackwardRefs]: +backward_refs,
					[gridHeaders.IssuedDate]: issue_date,
					[gridHeaders.FilingDate]: app_filing_date,
					[gridHeaders.PriorityDate]: priority_date,
					[gridHeaders.GrantTime]: +grant_time,
					[gridHeaders.Continuances]: +open_continuances,
					[gridHeaders.Defs]: count_of_defendants
		    };
	  	});
	  };

	 	const loadPatentGrid = (page=1) => {
	 		// test data load
	 		$http.get('./assets/data/records.json').success((data) => {
	 			if(data.count) {
	 				fillPatentGrid(data.results);
	 				if(data.next) {
	 					// invoke load patent again
	 					loadPatentGrid(page + 1);
	 				}
	 			}
	 		});
	  };

		loadPatentGrid();
	}

})();
