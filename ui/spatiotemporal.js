define(function(require){

var Layout = require('vastui/layout'),
    Panel = require('vastui/panel'),
    Button = require('vastui/button'),
    ButtonGroup = require('vastui/button-group');

var arrays = require('p4/core/arrays'),
    stats = require('p4/dataopt/stats'),
    pipeline = require('p4/core/pipeline');

var geoMap = require('./geomap'),
    lineChart = require('i2v/charts/lineChart'),
    temporalPlot = require('./temporal-plot');

return function(arg) {
    var options = arg || {},
        data = options.data || [],
        igraph = options.igraph,
        colorMap = options.colorMap,
        colorScheme = options.colorScheme;

    var appLayout = new Layout({
        // margin: 10,
        padding: 5,
        container: 'page-right-view-body',
        rows: [
            {id: 'map-view', height: 0.7},
            {id: 'timeline-view', height: 0.3},
        ]
    });

    var views = {};

    views.timeline = new Panel({
        container: appLayout.cell('timeline-view'),
        id: "panel-timeline",
        title: "Time",
        header: {height: 35, style: {backgroundColor: '#FFF'}}
    });


    var timeMode = 0,
        timelineControl = new ButtonGroup({
        buttons: [
            new Button({
                label: 'Timeline',
                size: '9px',
                onclick: function() {timeMode = 0; updateTimeline()}
            }),
            new Button({
                label: 'Daily Stats',
                size: '9px',
                onclick: function() {timeMode = 2; updateTimeline()}
            }),
            new Button({
                label: 'Weekly Stats',
                size: '9px',
                onclick: function() {timeMode = 1;  updateTimeline()}
            })
        ]
    });

    views.timeline.header.append(timelineControl);

    views.map = new Panel({
        container: appLayout.cell('map-view'),
        id: "map",
        title: "Locations",
        header: {height: 35, style: {backgroundColor: '#FFF'}}
    });

    appLayout.map = geoMap({
        mapCenter: options.mapCenter,
        mapZoom: options.mapZoom,
        colorScheme: colorScheme
    });
    appLayout.views = views;

    let subjectGeos = {};
    let people = [];
    let datetimes = [];
    let areas = [];
    appLayout.setSubjects = subjectLocations => {
        // clear locations
        R.forEachObjIndexed(
                geo => appLayout.map.removeLocations(geo.mapObjs),
                subjectGeos);
        appLayout.map.highlightLocations([]);
        // add locations
        people = [];
        subjectGeos = R.mapObjIndexed((locations, subjectKey) => {
            let mapObjs =
                    appLayout.map.addLocations(
                        locations, { color: colorMap(subjectKey) });
            people.push(subjectKey);
            return { mapObjs: mapObjs, locations: locations };
        })(subjectLocations);
        console.log(subjectGeos);
        // update timeline
        updateTimeline();
    }
    appLayout.addSubject = (subjectKey, locations) => {
        // add locations to map
        let aboutToFly = R.isEmpty(subjectGeos);
        let mapObjs =
                appLayout.map.addLocations(
                    locations, { color: colorMap(subjectKey) });
        subjectGeos[subjectKey] = {
            mapObjs: mapObjs,
            locations: locations
        };
        people.push(subjectKey);
        if(aboutToFly) flyToLocations(locations);
        // update timeline
        updateTimeline();
    }
    appLayout.removeSubject = (subjectKey) => {
        people.splice(people.indexOf(subjectKey), 1);
        // remove locations from map
        appLayout.map.removeLocations(subjectGeos[subjectKey].mapObjs);
        delete subjectGeos[subjectKey];
        // update timeline
        updateTimeline();
    }

    appLayout.map.onadd(function(d){

        var c = d.coordinates,
            cMinLat = Math.min(c[0].lat, c[1].lat),
            cMaxLat = Math.max(c[0].lat, c[1].lat),
            cMinLong = Math.min(c[0].lng, c[1].lng),
            cMaxLong = Math.max(c[0].lng, c[1].lng);

        d.box = {lat: [cMinLat, cMaxLat], lng: [cMinLong, cMaxLong]};
        d.label = areas.length;
        d.labelPrefix = 'Location';

        var selectedLocations =
                toLocations(subjectGeos).filter(function(a){
            return (a.lat < cMaxLat && a.lat > cMinLat && a.long < cMaxLong && a.long > cMinLong);
        })
        var links = pipeline()
        .group({
            $by: ['user'],
            value: {'location': '$count'}
        })
        (selectedLocations);
        // console.log(links);
        areas.push(d);
        igraph.addNodes({
            label: d.label,
            labelPrefix: 'Location ',
            type: "location",
            pos: [0,0],
            value: selectedLocations.length
        }).update();

        links.forEach(function(li){
            li.source = igraph.findNode({type: 'people', tag: li.user});
            li.target = igraph.findNode({type: 'location', tag: d.label});
        });
        // console.log(links);
        igraph.addLinks(links)
        .update();
    })

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

    let flyToLocations = (locs) => {
        let minmax = calcLocsRect(locs);
        appLayout.map.flyToBounds([
            [minmax.min.lat, minmax.min.long],
            [minmax.max.lat, minmax.max.long]
        ]);
    }

    let generateLinks = R.curry((allLocs, d, area) => {
        // console.log(datetimes);
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
                console.log(res[key]);
                newLinks.push({
                    source: igraph.findNode({type: 'people', tag: res.user}),
                    target: igraph.findNode({type: 'time', tag: res[key]}),
                    value: res.value,
                    dest: res.area
                });
                newLinks.push({
                    source: igraph.findNode({type: 'time', tag: res[key]}),
                    target: igraph.findNode({type: 'location', tag: res.area}),
                    value: res.value,
                    dest: res.area
                });
            });
        })

        // let people = R.keys(subjectGeos);
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
                    source: igraph.findNode({type: 'people', tag: res.user}),
                    target: igraph.findNode({type: 'location', tag: res.area}),
                    value: res.value,
                    dest: res.area
                });
            });
        }

        return newLinks;
    });

    let toLocations = R.pipe(R.toPairs,
            R.map(pair => pair[1].locations),
            R.flatten);

    let updateTimeline = () => {
        let toLocations = R.pipe(R.toPairs,
                R.map(pair => pair[1].locations),
                R.flatten);
        let allLocs = toLocations(subjectGeos);
        appLayout.updateTimeline({
            data: allLocs,
            people: people,
            onselect: (kv, d) => {
                datetimes.push(kv);

                igraph
                    .removeLinks({all:true})
                    .addNodes(d)
                    .update();

                let areasToLinks =
                        R.pipe(
                            R.map(generateLinks(allLocs)(d)), R.flatten);
                let newLinks = areasToLinks(areas);

                console.log(newLinks);

                igraph
                    .addLinks(newLinks)
                    .update();

            }
        })
    }


    let highlightLocationsByTimeSpan = timeSpan => {
        // console.log(timeSpan);
        let filterSubjectGeos = R.mapObjIndexed((geos, subjectKey) => {
            let filtered = R.filter(loc => {
                return loc.time.getTime() >= timeSpan[0].getTime()
                    && loc.time.getTime() < timeSpan[1].getTime();
            }, geos.locations);
            let locObjs = R.map(loc => {
                let fillColor = colorMap(subjectKey);
                let color = tinycolor(fillColor).complement().lighten(20).toHexString();
                // console.log(color);
                return {
                    latlng: [ loc.lat, loc.long ],
                    options: {
                        color: color,
                        fillColor: fillColor,
                        opacity: colorScheme.mapHighlightOpacity,
                        fillOpacity: colorScheme.mapHighlightOpacity
                    }
                };
            }, filtered);
            return locObjs;
        });
        let locObjs = R.pipe(
                filterSubjectGeos,
                R.toPairs,
                R.map(R.prop(1)),
                R.flatten)(subjectGeos);
        // console.log(locObjs);
        appLayout.map.highlightLocations(locObjs);
    }

    appLayout.updateTimeline = function(arg) {
        var options = arg ||  {},
            data = options.data,
            people = options.people,
            onSelect = options.onselect;

        views.timeline.clear();

        if(timeMode == 0) {
            var timespan = stats.domains(data, ['time']).time,
                duration = timespan[1] - timespan[0];

                var timeAggr = pipeline()
                .match({
                    user: {$in: people},
                })
                .derive(function(d){
                    d.timestep = Math.floor((d.time - timespan[0]) / (duration) * 256);
                })
                .group({
                    $by:  ['user', 'timestep'],
                        // time: '$min',
                    value: {'location': '$count'}
                })
                .sortBy({timestep: 1})
                (data);



                var timeSeries = new Array(people.length);
                people.forEach(
                        function(s, i){
                    timeSeries[i] = timeAggr
                        .filter(function(a) {
                            return a.user == s;
                        }).sort(function(a, b){
                            return b.timestep - a.timestep;
                        });
                })
                let extentToTimeWindow = R.curry((timeSpan, extent) => {
                    return [
                        new Date((timespan[0].getTime() + extent.x[0]/256 * duration)),
                        new Date((timespan[0].getTime() + extent.x[1]/256 * duration))
                    ]});
                var mainTimeline = new lineChart({
                    container: views.timeline.body,
                    height: views.timeline.innerHeight,
                    width: views.timeline.innerWidth,
                    padding: {left: 100, right: 50, top: 30, bottom: 50},
                    data: timeSeries,
                    formatX: function(d) {
                        var dt = new Date((timespan[0].getTime() + d/256 * duration));

                        if(duration < 3600 * 24 * 1000) {
                            return dt.getHours() + ":" + dt.getMinutes();
                        } else {
                            return [dt.getFullYear(), dt.getMonth(), dt.getDate()].join('-') ;
                        }
                    },
                    series: people,
                    // zero: true,
                    vmap: {
                        x: 'timestep',
                        y: 'value',
                        color: 'user',
                        colorMap: colorMap
                        // color: 'user',
                    },
                    onchange: R.pipe(extentToTimeWindow(timespan),
                        highlightLocationsByTimeSpan)
                })

        }
        if(timeMode == 1) {
            var dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            var weeklyStats = pipeline()
                .match({
                  user: {$in: people},
                })
                .derive(function(d){
                    d.dayStr = dayOfWeek[d.day];
                })
                .group({
                  $by: ['dayStr', 'user'],
                  count: '$count'
                })
                (data);

            var splot1 = new temporalPlot({
                container: views.timeline.body,
                height: views.timeline.innerHeight,
                width: views.timeline.innerWidth,
                padding: {left: 80, right: 40, top: 30, bottom: 60},
                data:  weeklyStats,
                title: 'Weekly Activities',
                domainX: dayOfWeek,
                colors: colorMap,
                onselect: function(d) {
                    var links = data.filter(function(a){
                    return a.dayStr == d;
                    });
                    var newNode = {
                        label: d,
                        type: 'time',
                        pos: [0, views.map.innerHeight],
                        value: links.map((d)=>d.count).reduce((a,b)=>a+b)
                    }
                    onSelect({dayStr: d}, newNode);
                },
                vmap: {
                    x: 'dayStr',
                    y: 'user',
                    size: 'count',
                    color: 'user',
                }
            })
        }else if(timeMode == 2) {
            var dailyStats = pipeline()
            .match({
                user: {$in: people},
            })
            .group({
                $by: ['hour', 'user'],
                count: {'location': '$count'}
            })
            .sortBy({hour: 1})
            (data);

            var splot2 = new temporalPlot({
                container: views.timeline.body,
                height: views.timeline.innerHeight,
                width: views.timeline.innerWidth,
                padding: {left: 80, right: 40, top: 30, bottom: 60},
                data:  dailyStats,
                align: 'left',
                formatX: function(d) { return d;},
                title: 'Daily Activities',
                colors: colorMap,
                onselect: function(d) {
                    var newNodeId = d;

                    var links = dailyStats.filter(function(a){
                        return a.hour == d;
                    });

                    var newNode = {
                        label: newNodeId,
                        type: 'time',
                        pos: [0, views.map.innerHeight],
                        value: links.map((d)=>d.count).reduce((a,b)=>a+b)
                    };
                    onSelect({hours: d}, newNode);
                },
                vmap: {
                    x: 'hour',
                    y: 'user',
                    size: 'count',
                    color: 'user',
                }
            })
        }

        // splot1.div.style.marginLeft =  views.timeline.innerWidth / 2 + 'px';
        // splot1.div.style.float = 'right';
    }

    return appLayout;
}

})
