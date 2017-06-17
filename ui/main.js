define(function(require) {

// dependencies
var Panel = require('vastui/panel.js'),
    Button = require('vastui/button');

var arrays = require('p4/core/arrays'),
    pipeline = require('p4/core/pipeline');

var ontoGraph = require('./ontology-graph');

return function(webSocket) {

    var ui = require('./layout/layout')();
    var spatiotemporal = require('./spatiotemporal')({
        container: ui.cell('page-right'),
        mapZoom: 2
    });
    var map = spatiotemporal.map;

    var people = [], //array of IDs
        locations = {},
        locationMarks = {};

    var areas = [],
        datetimes = [];

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
        graph: {nodes: [], links: []}
    });

    graphPanel.header.append(new Button({
        label: '+Node',
        types: ['blue'],
        size: '0.6em'
    }))

    graphPanel.header.append(new Button({
        label: '+Edge',
        types: ['blue'],
        size: '0.6em'
    }))

    graphPanel.header.append(new Button({
        label: 'Share',
        types: ['teal'],
        size: '0.6em',
        onclick: function() {
            var graph = {
                nodes: igraph.getNodes(),
                links: igraph.getLinks()
            };
            console.log('push graph to server');
            webSocket.emit('push', graph);
        }
    }))


    $('#panel-igraph').transition('fade left');

    /// TODO: consider defining class Rect.
    let calcLocsRect = locs => {
        let minmax = R.reduce((acc, loc) => {
            let lat = parseFloat(loc.lat);
            let long = parseFloat(loc.long);
            return {
                min: {
                    lat: Math.min(acc.min.lat, lat),
                    long: Math.min(acc.min.long, long)
                },
                max: {
                    lat: Math.max(acc.max.lat, lat),
                    long: Math.max(acc.max.long, long)
                }
            }
        }, {
            min: {
                lat: Number.POSITIVE_INFINITY,
                long: Number.POSITIVE_INFINITY,
            },
            max: {
                lat: Number.NEGATIVE_INFINITY,
                long: Number.NEGATIVE_INFINITY,
            }
        }, locs);
        console.log(minmax);
        return minmax;
    }

    let addLocationsToMap = (pid, locs) => {
        people.push(pid);
        if(!locations.hasOwnProperty(pid)){
            locations[pid] = locs;
            locationMarks[pid] =
                    map.addLocations(locs, {color: 'purple'});
        } else {
            map.removeLocations(locationMarks[pid]);
            delete locations[pid];
            delete locationMarks[pid];
        }
    }

    let flyToLocations = (locs) => {
        let minmax = calcLocsRect(locs);
        map.flyToBounds([
            [minmax.min.lat, minmax.min.long],
            [minmax.max.lat, minmax.max.long]
        ]);
    }

    let generateLinks = R.curry((allLocs, d, area) => {
        console.log(datetimes);
        let newLinks = [];
        let filter = {};
        filter.lat = {$inRange: area.box.lat};
        filter.long = {$inRange: area.box.lng};
        filter.$or = datetimes;
        var matches = pipeline().match(filter)(allLocs);
        filter.$or.forEach(function(dt){
            var key = Object.keys(dt)[0];
            var results = pipeline()
            .group({
                $by: ['user', key],
                value: '$count'
            })
            .derive(function(d){
                d.area = area.label;
            })
            (matches);

            results.forEach(function(res){
                newLinks.push({
                    source: res.user,
                    target: res[key],
                    value: res.value,
                    dest: res.area
                });
                newLinks.push({
                    source: res[key],
                    target: res.area,
                    value: res.value,
                    dest: res.area
                });
            });
        })

        var matchedPeople =
                arrays.unique(matches.map((d)=>d.user));
        var otherPeople =
                arrays.diff(people,matchedPeople);

        if(otherPeople.length) {
            var extraReults = pipeline()
            .match({
                user: {$in: otherPeople}
            })
            .group({
                $by: ['user'],
                value: '$count'
            })
            .derive(function(d){
                d.area = area.label;
            })
            (allLocs);

            extraReults.forEach(function(res){
                newLinks.push({
                    source: res.user,
                    target: res.area,
                    value: res.value,
                    dest: res.area
                });
            });
        }
        console.log(extraReults, newLinks);
        return newLinks;
    });

    var selection = require('/selection')({
        container: 'domain-vis',
        igraph: igraph
    });
    selection.onSelect = function(pid, locs) {
        let aboutToFly = R.isEmpty(locations) ? true : false;
        addLocationsToMap(pid, locs);
        if (aboutToFly) {
            flyToLocations(locs);
        }

        // igraph.append({
        //     nodes: {id: pid, type: "people", pos: [100,100], value: 0},
        //     links: []
        // });

        var allLocs = getAllLocations();
        if(allLocs.length){
            spatiotemporal.updateTimeline({
                data: allLocs,
                people: people,
                onselect: function(kv, d) {
                    datetimes.push(kv);

                    let areasToLinks =
                            R.pipe(R.map(generateLinks(allLocs)(d)),
                                R.flatten);
                    let newLinks = areasToLinks(areas);
                    // areas.forEach(R.partial(generateLinks, d));

                    igraph.update({
                        nodes: d,
                        links: newLinks
                    });
                }
            });
        }
    }
    map.flyTo(selection.mapCenter, selection.mapZoom);

    map.onadd(function(d){

        var c = d.coordinates,
            cMinLat = Math.min(c[0].lat, c[1].lat),
            cMaxLat = Math.max(c[0].lat, c[1].lat),
            cMinLong = Math.min(c[0].lng, c[1].lng),
            cMaxLong = Math.max(c[0].lng, c[1].lng);

        d.box = {lat: [cMinLat, cMaxLat], lng: [cMinLong, cMaxLong]};
        d.label = "Location " + areas.length;

        var selectedLocations = getAllLocations().filter(function(a){
            return (a.lat < cMaxLat && a.lat > cMinLat && a.long < cMaxLong && a.long > cMinLong);
        })
        // console.log(selectedLocations);
        var links = pipeline()
        .group({
            $by: ['user'],
            count: {'location': '$count'}
        })
        (selectedLocations);

        areas.push(d);
        igraph.append({
            nodes: {id: d.label  , type: "location", pos: [0,0], value: selectedLocations.length},
            links: links
        });
    })

}

});
