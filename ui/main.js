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
var Comparator = require('./comparator')


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
        container: 'page-middle-view-body',
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

    var gitPanel = new Panel({
        margin: 4,
        // container: ui.views.left.body,
        container: "page-left-view-body",
        id: 'gitPanel',
        title: 'Local Provenance',
        header: {height: 0.07, style: {backgroundColor: '#FFF'}},
    })

    gitPanel.header.append(new Button({
        label: 'Push',
        types: ['blue', 'large'],
        size: '12px',
        onclick: function() {
            $('#commit-note').val('');
            $('#commit-modal').modal('show');
        }
    }))

    console.log(parseInt(gitPanel.body.style.width));

    var hl = new gitTree({
        id: 'individial',
        container: gitPanel.body,
        width: parseInt(gitPanel.body.style.width),
        height: parseInt(gitPanel.body.style.height)
    })

    hl.setIgraphLocalState = function(node){
        igraph.setLocalState(node);
    }

    hl.onIGraphBuild = function(infos, curNode, not_reset){
        igraph.setLocalState(curNode);
        if(!not_reset){
            igraph.allReset();
        }
        infos = Array.isArray(infos)? infos : [infos];
        igraph.switchHist("off");
        spatiotemporal.map.onRenew();
        let visData = igraph.fetchVisData();
        if(visData.areas.length > 0){
            spatiotemporal.map.loadMap(visData, true);
        }
        let collector = [];
        for(var i = 0; i < infos.length; i++){
            if(infos[i].action === "Merge"){
                collector = collector.concat(infos[i].mergeInfo.map((k) => {return k.node;}).reverse());
            }else{
                collector.push(infos[i]);
            }
        }
        let set = new Set(collector);
        collector = Array.from(set);
        collector = collector.reverse();    
        for(var i = 0; i < collector.length; i++){
            let info = collector[i];
            if(info.action == "Add link"){
                igraph.addLinks({
                    source: info.source,
                    target: info.target,
                    // value: 2,
                    // datalink: false
                });
            }else if(info.action == "Add node"){
                igraph.addNodes({
                    label: info.nodename,
                    reason: info.reason,
                    labelPrefix: '',
                    icon: info.type,
                    type: info.type,
                    pos: [100,100],
                    visData: info.data,
                    // value: value
                });
            }else if(info.action == "Remove link"){
                igraph.removeLinks({source: info.source.label, target: info.target.label});
            }else if(info.action == "Remove node"){
                igraph.removeNodes({label: info.nodename});
            }else if(info.action === "Merge"){
                console.log("No merge is expected.");
            }
        }
        igraph.switchHist("on");
        igraph.update();
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

    igraph.removeGeo = function(visData){
        spatiotemporal.removeGeoByVisData(visData);
    }

    igraph.modifyHist = function(d, info){
        console.log(d);
        console.log(info);
        hl.modifyByNodename(d, info);
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

    $("#confirm-commit").click(function(){
        // var graph = {
        //     nodes: igraph.getNodes(),
        //     links: igraph.getLinks()
        // };
        webSocket.emit('mergeRequest');
        // webSocket.emit('push', {
        //     pullStateId: igraph.pullState(),
        //     increments: increments,
        //     note: $('#commit-note').val()
        // });
    })

    var comparator = new Comparator({});

    webSocket.on('mergeReply', (data) => {
        console.log(data.master);   //Provenance of master branch
        let rst = comparator.getCompareResult(hl.getPullState(), hl.Root, data.master);
        console.log(rst);
        if(Object.keys(rst.conflictNodes).length || Object.keys(rst.conflictLinks).length){
            console.log("Conflict(s) Detected.");
            console.log(rst.conflictNodes);
            console.log(rst.conflictLinks);
            comparator.getConflictTree();
        }else{
            var increments = igraph.getIncrementsAndClear();
            var areaRepo = [];
            var dataRepo = [];
            var linkNodesRepo = [];
            var linkDataRepo = [];
            for(var i = 0; i < increments.length; i++){
                if(increments[i].data && increments[i].data.area.leaflet){
                    areaRepo.push(increments[i].data.area);
                    dataRepo.push(increments[i].data.area.leaflet);
                    increments[i].data.area.leaflet = null;
                }
                if(increments[i].source.visData && increments[i].source.visData.area.leaflet){
                    areaRepo.push(increments[i].source.visData.area);
                    dataRepo.push(increments[i].source.visData.area.leaflet);
                    increments[i].source.visData.area.leaflet = null;
                }
                if(increments[i].target.visData && increments[i].target.visData.area.leaflet){
                    areaRepo.push(increments[i].target.visData.area);
                    dataRepo.push(increments[i].target.visData.area.leaflet);
                    increments[i].target.visData.area.leaflet = null;
                }

            }
            webSocket.emit('push', {
                pullNodename: hl.getPullState().nodename,
                increments: increments,
                note: $('#commit-note').val()
            });
            for(var i = 0; i < areaRepo.length; i++){
                areaRepo[i].leaflet = dataRepo[i];
            }
            console.log(rst);
            hl.setPullState(hl.merge([hl.Root, rst.leafNode]));
            hl.refresh();
        }
    });

    webSocket.on('pullRespond', function(node){
        hl.clearRoot(node);
        hl.setPullState(node);
        hl.refresh();
        hl.selectCurShowNode(node);
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

    areaCnt = 0;
    spatiotemporal.onAddToConceptMap = (d) => {
        let visData ={
            mapZoom: {
                center: map.getCenter(),
                zoom: map.getZoom(),
            },
            area: {
                coordinates: d.coordinates,
                type: d.type,
                name: d.name,
                reason: d.reason
            },
        }
        console.log(visData.mapZoom);
        igraph.addNodes({
            label: d.name,
            reason: d.reason,
            labelPrefix: '',
            icon: 'location',
            type: 'location',
            pos: [100,100],
            visData: visData,
        }).update();
        areaCnt++;
    }
    map.flyTo(selection.mapCenter, selection.mapZoom);
}

});