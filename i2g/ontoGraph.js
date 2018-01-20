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



        //0
        igraph.addNodes({
            label: 'Taliban',
            type: 'people',
            fx: 600,
            fy: 400,
            value: 0,
            datalink: false
        }).update();

        //1
        igraph.addNodes({
            label: 'Tehrik-i-Taliban Pakistan',
            type: 'people',
            fx: 1200,
            fy: 400,
            value: 0,
            datalink: false
        }).update();

        //2
        igraph.addNodes({
            label: 'South Asia',
            type: 'location',
            fx: 900,
            fy: 200,
            value: 0,
            datalink: false
        }).update();


        //3
        igraph.addNodes({
            label: 'Firearms',
            type: 'info',
            fx: 900,
            fy: 400,
            value: 0,
            datalink: false
        }).update();

        //4
        igraph.addNodes({
            label: 'Explosives/Bombs/Dynamite',
            type: 'info',
            fx: 900,
            fy: 600,
            value: 0,
            datalink: false
        }).update();

        //5
        igraph.addNodes({
            label: 'Active: 1995-2015',
            type: 'time',
            fx: 300,
            fy: 400,
            value: 0,
            datalink: false
        }).update();

        //6
        igraph.addNodes({
            label: 'Active: 2007-2015',
            type: 'time',
            fx: 1500,
            fy: 400,
            value: 0,
            datalink: false
        }).update();

        //7
        igraph.addNodes({
            label: 'Attack type',
            type: 'info',
            fx: 700,
            fy: 300,
            value: 0,
            datalink: false
        }).update();

        //8
        igraph.addNodes({
            label: 'Attack type',
            type: 'info',
            fx: 1100,
            fy: 300,
            value: 0,
            datalink: false
        }).update();




        igraph.addLinks({
            source: 0,
            target: 7,
            value: 2
        }).update();

        igraph.addLinks({
            source: 7,
            target: 2,
            value: 2
        }).update();

        igraph.addLinks({
            source: 1,
            target: 8,
            value: 2
        }).update();

        igraph.addLinks({
            source: 8,
            target: 2,
            value: 2
        }).update();

        igraph.addLinks({
            source: 0,
            target: 3,
            value: 2
        }).update();

        igraph.addLinks({
            source: 1,
            target: 3,
            value: 2
        }).update();

        igraph.addLinks({
            source: 0,
            target: 4,
            value: 2
        }).update();

        igraph.addLinks({
            source: 1,
            target: 4,
            value: 2
        }).update();

        igraph.addLinks({
            source: 0,
            target: 5,
            value: 2
        }).update();

        igraph.addLinks({
            source: 1,
            target: 6,
            value: 2
        }).update();
        
        
    }
})