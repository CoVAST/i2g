define(function(require) {
	
	var ontoGraph = require('./i2g'), //get ontology-graph.js for ontology graph functions
		colorScheme = require('./color-scheme'); //get color-scheme.js for defined color

	return function(arg) {
        'use strict';

        var igraph = ontoGraph({
	        container: "#ontoGraph",
	        width: 1900,
	        height: 1000,
	        domain: [0, 1],
	        graph: {nodes: [], links: []},
	        notePanel: [],
	        historyList: [],
	        colorScheme: colorScheme
	    });
    };
})