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
var gitTree = require('./gitTree');


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

    var hl = new gitTree({
        id: 'igraph-history',
        container: hlContainer,
        width: 200,
        height: 500
    })

    hl.onClickShow(node){
        igraph.onTreeResponse(node);
    }


    // var hl = new List({
    //     container: hlContainer,
    //     id: 'igraph-history',
    //     types: ['selection', 'single'],
    //     onselect: (id) => {
    //         console.log("Show hist at timestamp " + id);
    //         igraph.showRecHist(id);
    //         spatiotemporal.map.onRenew();

    //         var visData = igraph.fetchVisData(id);
    //         spatiotemporal.removeAllSubjects();
    //         spatiotemporal.removeAllAreas();
    //         if(!!visData && !!visData.totalDataIdxs){
    //             for(var i = 0 ; i < visData.totalDataIdxs.length; i++){
    //                 spatiotemporal.addSubject(visData.totalDataIdxs[i], selection.fetchRealData(totalData));
    //             }
    //         } 
    //         if(!!visData) spatiotemporal.map.loadMap(visData, true);    
    //     }
    // });

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

    igraph.onCallRespondingMap = function(nodeId){
        spatiotemporal.markIdLocation(nodeId);
    }

    var spatiotemporal = require('./spatiotemporal')({
        container: ui.cell('page-right'),
        mapZoom: 2,
        igraph: igraph,
        colorScheme: colorScheme,
        colorMap: colorMap
    });

    spatiotemporal.onCallRespondingOntologyGraph = function(nodeId){
        igraph.ontologyGraphRespond(nodeId);
    }
    var map = spatiotemporal.map;

    function newUninfoNodeAdd(ntype) {
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
            {name: 'Custom node', icon: 'circle teal', onclick: newUninfoNodeAdd('custom')},
            {name: 'Person', icon: 'user teal', onclick: newUninfoNodeAdd('people')},
            {name: 'Location', icon: 'marker teal', onclick: newUninfoNodeAdd('location')},
            {name: 'Money', icon: 'usd teal', onclick: newUninfoNodeAdd('money')},
            {name: 'Datetime', icon: 'wait teal', onclick: newUninfoNodeAdd('time')},
            {name: 'Communication', icon: 'phone teal', onclick: newUninfoNodeAdd('phone')}
        ]
    });

    nodeChoices.style.marginRight = '0.5em';
    nodeChoices.style.position = 'absolute';
    nodeChoices.style.top = '10px';
    nodeChoices.style.left = '10px';

    // traceBackBtn.style.marginRight = '0.7em';
    // traceBackBtn.style.position = 'absolute';
    // traceBackBtn.style.top = '10px';
    // console.log(graphPanel.innerWidth)
    // traceBackBtn.style.left = '' + (graphPanel.innerWidth - 150) + 'px';

    graphPanel.append(nodeChoices);

    graphPanel.header.append(new Button({
        label: 'Provenance',
        types: ['teal', 'large'],
        size: '12px',
        onclick: function() {
            $('.ui.sidebar').sidebar('toggle');
        }
    }))

    graphPanel.header.append(new Button({
        label: 'Share',
        types: ['red', 'large'],
        size: '12px',
        onclick: function() {
            $('#commit-note').val('');
            $('#commit-modal').modal('show');
        }
    }))

    $("#confirm-commit").click(function(){
        // var graph = {
        //     nodes: igraph.getNodes(),
        //     links: igraph.getLinks()
        // };
        var increments = igraph.getIncrements();
        webSocket.emit('push', {
            pullStateId: igraph.pullState(),
            increments: increments,
            note: $('#commit-note').val()
        });
    })

    $('#graph-layout').transition('fade left');

    var selection = require('/selection')({ 
        // container: 'domain-vis',
        igraph: igraph,
        colorScheme: colorScheme
    });

    let subjectLocations = {};  //Only for subject-related people's location record
    selection.onSelect = function(subjectKey, locations) {
        if (R.has(subjectKey, subjectLocations)) {
            /// FIXME: this is not the best way to toggle selection.
            delete subjectLocations[subjectKey];
            //delete selection.totalData[subjectKey]; //TODO don't know whether 'let' domain hides subjectLocation, thus a new dict is used
            spatiotemporal.removeSubject(subjectKey);
            return;
        }
        // add subject to spatiotemporal panel
        subjectLocations[subjectKey] = locations;
        spatiotemporal.addSubject(subjectKey, locations);
        //selection.totalData[subjectKey] = locations;
    }
    selection.onMultiSelect = pidLocsArray => {
        let pidLocsToPair = pidLocs => [pidLocs.pid, pidLocs.locs];
        subjectLocations =
                R.pipe(R.map(pidLocsToPair), R.fromPairs)(pidLocsArray);
        spatiotemporal.setSubjects(subjectLocations);
    }

    selection.onAddToConceptMap = () => {   //To erase corresponding leaflet -- then to restore by simpler data in geomap
        for(var i = 0; i < spatiotemporal.areas.length; i++){
            spatiotemporal.areas[i].leaflet = null;
        }
        return spatiotemporal.areas;
    }
    areaCnt = 0;
    spatiotemporal.onAddToConceptMap = (d, value) => {
        let curData = d;
        let areas = selection.onAddToConceptMap();
        let visData ={
            //curData: curData,
            //totalData: selection.totalData,
            mapZoom: {
                center: map.getCenter(),
                zoom: map.getZoom(),
            },
            areas: areas
        }
        igraph.addNodes({
            label: d.name,
            reason: d.reason,
            labelPrefix: '',
            icon: 'location',
            type: 'location',
            pos: [100,100],
            visData: visData,
            value: value
        }).update();
        areaCnt++;
    }
    map.flyTo(selection.mapCenter, selection.mapZoom);
}

});