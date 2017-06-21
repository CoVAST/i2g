define(function(require) {

// dependencies
var Panel = require('vastui/panel'),
    Button = require('vastui/button'),
    Layout = require('vastui/layout'),
    Dropdown = require('vastui/dropdown'),
    List = require('vastui/list'),
    NotePanel = require('./notepanel');

var arrays = require('p4/core/arrays'),
    pipeline = require('p4/core/pipeline');

var ontoGraph = require('./ontology-graph');
var colorScheme = require('./color-scheme');

return function(webSocket) {

    var ui = require('./layout/layout')();

    var people = [], //array of IDs
        locations = {},
        locationMarks = {};

    var areas = [],
        datetimes = [];


    var colorMap = d3.scaleOrdinal(d3.schemeCategory10);

    function getAllLocations() {
        var locs = [];
        Object.keys(locations).forEach(function(k){
            locs = locs.concat(locations[k]);
        })
        return locs;
    }

    var graphLayout = new Layout({
        // margin: 2,
        // padding: 5,
        id: 'graph-layout',
        container: 'page-left-view-body',
        cols: [
            {
                id: 'graph-view',
                width: 1.0
            }
        ]
    })

    var graphPanel = new Panel({
        // margin: 11,
        // container: ui.views.left.body,
        container: graphLayout.cell('graph-view'),
        id: 'panel-igraph',
        title: 'Insight Graph',
        header: {height: 0.07, style: {backgroundColor: '#FFF'}}
    })

    var hlContainer = document.getElementById('page-sidebar');
    hlContainer.style.padding = '10px';
    hlContainer.style.paddingTop = '6em';
    hlContainer.innerHTML = '<h3>Provenance</h3>';
    var hl = new List({
        container: hlContainer,
        id: 'igraph-history',
        types: ['divided']
    });

    var np = new NotePanel({
        container: 'page-sidebar',
        id: 'igraph-notes',
        onopen: function() {$('.ui.sidebar').sidebar('toggle');}
    });

    var igraph = ontoGraph({
        container: graphPanel.body,
        width: graphPanel.innerWidth,
        height: graphPanel.innerHeight,
        domain: [0, 1],
        graph: {nodes: [], links: []},
        notePanel: np,
        historyList: hl,
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

    function newNodeAdd(ntype) {
        return function() {
            igraph.addNodes({
                label: 'new ' + ntype,
                type: ntype,
                fx: 100,
                fy: 100,
                value: 0,
                datalink: false
            }).update();
            // np.show();
        }
    }

    var nodeChoices = new Dropdown({
        label: "+Node",
        items: [
            {name: 'Custom node', icon: 'circle teal', onclick: newNodeAdd('custom')},
            {name: 'Person', icon: 'user teal', onclick: newNodeAdd('people')},
            {name: 'Location', icon: 'marker teal', onclick: newNodeAdd('location')},
            {name: 'Money', icon: 'usd teal', onclick: newNodeAdd('money')},
            {name: 'Datetime', icon: 'wait teal', onclick: newNodeAdd('time')},
            {name: 'Communication', icon: 'phone teal', onclick: newNodeAdd('phone')}
        ]
    });
    nodeChoices.style.marginRight = '0.5em';
    nodeChoices.style.position = 'absolute';
    nodeChoices.style.top = '10px';
    nodeChoices.style.left = '10px';

    graphPanel.append(nodeChoices);

    graphPanel.header.append(new Button({
        label: 'Provenance',
        types: ['large'],
        size: '12px',
        onclick: function() {
            $('.ui.sidebar').sidebar('toggle');
        }
    }))

    graphPanel.header.append(new Button({
        label: 'Share',
        types: ['teal', 'large'],
        size: '12px',
        onclick: function() {
            var graph = {
                nodes: igraph.getNodes(),
                links: igraph.getLinks()
            };
            console.log('push graph to server', graph);
            webSocket.emit('push', graph);
        }
    }))


    $('#graph-layout').transition('fade left');

    var selection = require('/selection')({
        // container: 'domain-vis',
        igraph: igraph,
        colorScheme: colorScheme
    });


    let subjectLocations = {};
    selection.onSelect = function(subjectKey, locations) {
        if (R.has(subjectKey, subjectLocations)) {
            /// FIXME: this is not the best way to toggle selection.
            delete subjectLocations[subjectKey];
            spatiotemporal.removeSubject(subjectKey);
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
