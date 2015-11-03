
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
			if(angular.isUndefined(searchTerm) || searchTerm === '') { return true; }
	
			const subPattern = '(>|>\\s*=|<|<\\s*=|=|<\\s*>|!\\s*=)\\s*(\\d+|\\d*\\\\.\\d+|\\d+\\\\.\\d*)';
			const pattern = new RegExp(`^\\s*${subPattern}\\s*(?:${subPattern})?\\s*$`);
			const result = searchTerm.match(pattern);
			const trimmer = (s) => s.replace(/\s+|\\/g, '');
			const parseFun = (v) => ((v | 0) === v) ? parseInt : parseFloat;
			const parser = parseFun(cellValue);

			const operations = {
				'>': (left, right) => left > right,
				'>=': (left, right) => left >= right,
				'<': (left, right) => left < right,
				'<=': (left, right) => left <= right,
				'=': (left, right) => left === right,
				'!=': (left, right) => left !== right,
				'<>': (left, right) => left !== right,
			};

			if(result) {
				let [, op1, v1, op2, v2] = result;
				let output = operations[trimmer(op1)](cellValue, parser(trimmer(v1)));
				return op2 ? output && operations[trimmer(op2)](cellValue, parser(trimmer(v2))) : output;
			}

			return cellValue === parser(trimmer(searchTerm));
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

		const preferences = (() => {
			let p = localStorage.getItem('insight.preferences');
			if(!p) {
				p = { patentGrid: { visibleColumns: ['Pat#', 'Topic Cluster', 'Score'] } };
				localStorage.setItem('insight.preferences', JSON.stringify(p));
				return p;
			}
			return JSON.parse(p);
		})();

		const updatePreferences = () => {
			preferences.patentGrid.visibleColumns = gridColumns.filter((col) => col.visible).map((col) => col.field);
			localStorage.setItem('insight.preferences', JSON.stringify(preferences));	
		};

		const isVisibleColumn = (name) => preferences.patentGrid.visibleColumns.indexOf(name) !== -1;

		let gridColumns = [
	    { field: gridHeaders.Patent, },
	    { field: gridHeaders.Title, },
	    { field: gridHeaders.TopicCluster, },
	    { field: gridHeaders.Score, type: 'number', filter: { noTerm: true, condition: numGridFilter } },
	    { field: gridHeaders.ShortestClaim, type: 'number', filter: { noTerm: true, condition: numGridFilter } },
	    { field: gridHeaders.CurrentAssignee, },
	    { field: gridHeaders.IPC, },
	    { field: gridHeaders.Family, },
	    { field: gridHeaders.ForwardRefs, type: 'number', filter: { noTerm: true, condition: numGridFilter } },
	    { field: gridHeaders.BackwardRefs, type: 'number', filter: { noTerm: true, condition: numGridFilter } },
	    { field: gridHeaders.IssuedDate, type: 'string', sortingAlgorithm: dateGridSorter },
	    { field: gridHeaders.FilingDate, type: 'string', sortingAlgorithm: dateGridSorter },
	    { field: gridHeaders.PriorityDate, type: 'string', sortingAlgorithm: dateGridSorter },
	    { field: gridHeaders.GrantTime, type: 'number', filter: { noTerm: true, condition: numGridFilter } },
	    { field: gridHeaders.Continuances, type: 'number', filter: { noTerm: true, condition: numGridFilter } },
	    { field: gridHeaders.Defs, type: 'number', filter: { noTerm: true, condition: numGridFilter } },
	  ];

	  gridColumns.forEach((col) => col.visible = isVisibleColumn(col.field));


	  const menuItems = gridColumns.map((col) => {
	  	return {
	  		title: col.field,
	  		icon: col.visible ? 'ui-grid-icon-ok' : 'ui-grid-icon-cancel',
	  		action: ($event) => {
	  			col.visible = !col.visible;
	  			this.icon = col.visible ? 'ui-grid-icon-ok' : 'ui-grid-icon-cancel';
	  			$scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
	  		}
	  	};
	  });

	  gridColumns.forEach((col) => {
	  	col.enableHiding = false;
	  	col.menuItems = menuItems;
	  });


		$scope.grid = {
	    enableSorting: true,
	    enableFiltering: true,
	    enableColumnMenu: true,
	    columnDefs: gridColumns,
	    onRegisterApi: function( gridApi ) {
	      $scope.gridApi = gridApi;
	      gridApi.core.registerColumnsProcessor((cols) => {
	      	updatePreferences();
	      	return cols;
	      });
	    },
	    data: []
	  };

	  const fillPatentGrid = (data) => {
	  	$scope.grid.data = $scope.grid.data.concat(data.map((d) => {
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
					[gridHeaders.Defs]: +count_of_defendants
		    };
	  	}));
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
