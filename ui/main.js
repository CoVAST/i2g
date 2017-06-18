define(function(require) {

// dependencies
var Panel = require('vastui/panel.js'),
    Button = require('vastui/button'),
    Dropdown = require('vastui/dropdown');

var arrays = require('p4/core/arrays'),
    pipeline = require('p4/core/pipeline');

var ontoGraph = require('./ontology-graph');

return function(webSocket) {

    var ui = require('./layout/layout')();

    var people = [], //array of IDs
        locations = {},
        locationMarks = {};

    var areas = [],
        datetimes = [];

    var colorScheme = {
        colors: ['#EC644B', '#446CB3', '#4ECDC4', '#F7CA18', '#F89406'],
        semantic: '#2ABEB3',
        area: '#2ABEB3',
        // people: '#D35400',
        time: '#4183D7'
    }

    var colorMap = d3.scaleOrdinal(d3.schemeCategory10);

    function getAllLocations() {
        var locs = [];
        Object.keys(locations).forEach(function(k){
            locs = locs.concat(locations[k]);
        })
        return locs;
    }

    var graphPanel = new Panel({
        container: ui.views.left.body,
        id: "panel-igraph",
        title: "Insight Graph",
        header: {height: 0.07, style: {backgroundColor: '#FFF'}}
    })


    var igraph = ontoGraph({
        container: graphPanel.body,
        width: graphPanel.innerWidth,
        height: graphPanel.innerHeight,
        domain: [0, 1],
        graph: {nodes: [], links: []},
        colorScheme: colorScheme
    });

    var spatiotemporal = require('./spatiotemporal')({
        container: ui.cell('page-right'),
        mapZoom: 2,
        igraph: igraph,
        colorScheme: colorScheme,
        colorMap: colorMap
    });
    var map = spatiotemporal.map;

    var nodeChoices = new Dropdown({
        label: "+Node",
        items: [
            {name: 'Custom node', icon: 'circle teal'},
            {name: 'Location', icon: 'marker teal', onclick: function() { console.log(igraph.update);}}
        ]
    });
    nodeChoices.style.marginRight = '0.5em';
    graphPanel.header.append(nodeChoices);


    graphPanel.header.append(new Button({
        label: 'Provenance',
        types: ['large'],
        onclick: function() {
            $('.ui.sidebar').sidebar('toggle');
        }
    }))

    graphPanel.header.append(new Button({
        label: 'Share',
        types: ['teal', 'large'],
        // size: '0.6em',
        onclick: function() {
            var graph = {
                nodes: igraph.getNodes(),
                links: igraph.getLinks()
            };
            console.log('push graph to server');
            webSocket.emit('push', graph);
        }
    }))



    var notePanel = new Panel({
        container:'page-sidebar',
        id: "igraph-notes",
        // width: graphPanel.innerWidth/3,
        // height: 300,
        padding: 10,
        style: {
            position: 'fixed',
            // display: 'none',
            bottom: 0,
            left: 0,
            height: 'auto',
            'text-align': 'right'
        }
        // title: "Insight Graph",
        // header: {height: 0.07, style: {backgroundColor: '#FFF'}}
    })

    notePanel.append(
        '<div class="ui form" style="text-align:left">'+
            '<div class="field"><label>Label</label><input type="text"></div>' +
            '<div class="field"><label>Detail</label>' +
                '<textarea id="user-notes"></textarea>' +
            '</div>' +
        '</div><br />'
    );

    notePanel.append(new Button({
        label: ' Save ',
        types: ['positive']
    }));

    notePanel.append(new Button({
        label: 'Cancel',
        types: ['negative']
    }));

    $('#panel-igraph').transition('fade left');

    var selection = require('/selection')({
        container: 'domain-vis',
        igraph: igraph,
        colorScheme: colorScheme
    });


    let subjectLocations = {};
    selection.onSelect = function(subjectKey, locations) {
        if (R.has(subjectKey, subjectLocations)) {
            /// TODO: this is not the best way to toggle selection.
            spatiotemporal.removeSubject(subjectKey);
            delete subjectLocations[subjectKey];
            return;
        }
        // add subject to spatiotemporal panel
        subjectLocations[subjectKey] = locations;
        spatiotemporal.addSubject(subjectKey, locations);
    }
    selection.onMultiSelect = pidLocsArray => {
        let pidLocsToPair = pidLocs => [pidLocs.pid, pidLocs.locs];
        subjectLocations =
                R.pipe(R.map(pidLocsToPair), R.fromPairs)(pidLocsArray);
        spatiotemporal.setSubjects(subjectLocations);
    }
    map.flyTo(selection.mapCenter, selection.mapZoom);

}

});
