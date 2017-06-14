define(function(require) {
    // dependencies
    var ajax = require('p4/io/ajax'),
        dsv = require('p4/io/parser'),
        dataStruct = require('p4/core/datastruct'),
        arrays = require('p4/core/arrays'),
        pipeline =require('p4/core/pipeline'),
        stats = require('p4/dataopt/stats'),
        cstore = require('p4/cquery/cstore'),
        colors = require('i2v/colors'),
        lineChart = require('i2v/charts/lineChart'),
        scatterPlot = require('./temporal-plot'),
        format = require('i2v/format')('.2s');

    var relationGraph = require('./relation-graph'),
        ontoGraph = require('./ontology-graph'),
        temporalArea = require('./temporal-area'),
        geoMap = require('./geomap');

    return function() {
        var relationshipLayout = require('./layout/relationship')(),
            relationViews = relationshipLayout.views;
        var geospatialLayout = require('./layout/geospatial')(),
            geoViews = geospatialLayout.views;
        var textLayout = require('./layout/textlayout')(),
            textViews = textLayout.views;

        var gmap = geoMap();
        ajax.getAll([
            {url: '/data/test-relationship-small.csv', dataType: 'text'},
            {url: '/data/test-geo280k-small.csv', dataType: 'text'}
        ]).then(function(text){
            var data = {};

            data.relationship = dataStruct({
                array: dsv(text[0], '\t'),
                header: ['source', 'target'],
                types: ['int', 'int']
            }).objectArray();

            data.geo = dataStruct({
                array: dsv(text[1], '\t'),
                header: ['user', 'time', 'lat', 'long', 'location'],
                types: ['int', 'time', 'float', 'float', 'string']
            }).objectArray();

            var subjects = pipeline()
            .group({
                $by: 'source',
                connection: {target: '$count'}
            })
            (data.relationship);

            // var selectedSubject = pipeline()
            // .match({
            //     source: 0
            // })
            // (data.relationship);

            var activityTotal = pipeline()
            .group({
                $by: 'user',
                count: {'location': '$count'}
            })(data.geo)
            // console.log(activityTotal);

            subjects.forEach(function(s, i){
                relationshipLayout.subjects.append({
                    header: 'Subject ' + i,
                    icon: 'big spy',
                    text: subjects[i].connection + ' connections, ' +
                            activityTotal[i].count + ' activtiies'
                })
            });
            relationshipLayout.subjects.get(0).className = 'selected item';

            var selectedSubjectID = 0, selectedPeople = [];
            var selectedSubject = pipeline()
            .match({
                source: selectedSubjectID,
                // target: {$inRange: [0, 200]}
            })
            (data.relationship);

            var locations = pipeline()
            .match({
                user: selectedSubjectID,
                long: {$inRange: [-123, -120]}
            })
            (data.geo);


            locations.forEach(function(loc){
                L.circle([loc.lat, loc.long], {
                    color: 'none',
                    fillColor: 'teal',
                    // weight: 1,
                    fillOpacity: 0.5,
                    radius: 200
                }).addTo(gmap.subjectLocations);
            })

            var nodes = [
                {
                    id: selectedSubjectID,
                    group: 0,
                    value: activityTotal[selectedSubjectID].count
                }
            ];
            nodes = nodes.concat(selectedSubject.map(function(d,i){
                return {
                    id: d.target,
                    group: 1,
                    value: activityTotal[d.target].count || 0
                };
            }));

            var nodeIDs = nodes.map(function(d){return d.id;})
            var graph = {
                nodes: nodes,
                links: data.relationship.filter(function(d){
                    return nodeIDs.indexOf(d.source) != -1 &&
                            nodeIDs.indexOf(d.target)!=-1;
                })
            }



            relationshipLayout.selections.append({
                header: 'Subject ' + selectedSubjectID + ' (' +
                        activityTotal[selectedSubjectID].count + ' activtiies)',
                icon: 'spy'
            })

            // console.log(selectedSubject, graph);
            var activityCounts = activityTotal.map(function(d){return d.count});
            var allGeoLocations;

            relationGraph({
                container: '#panel-relationship-body',
                width: relationshipLayout.views.relationship.innerWidth,
                height: relationshipLayout.views.relationship.innerHeight,
                domain: [d3.min(activityCounts), d3.max(activityCounts)],
                graph: graph,
                onselect: function(d) {
                    if(d.id != selectedSubjectID) {
                        this.style.fill = 'purple';
                        if(selectedPeople.indexOf(d.id) == -1){
                            selectedPeople.push(d.id);
                            relationshipLayout.selections.append({
                                header: 'Related Person ' + d.id + ' (' +
                                    activityTotal[d.id].count + ' activtiies)',
                                icon: 'user purple'
                            })
                        }
                    }

                    allGeoLocations = pipeline()
                    .derive(function(d){
                        d.month = d.time.getMonth();
                        d.day = d.time.getDay();
                        d.hour = d.time.getHours();
                    })
                    .match({
                        user: {$in: selectedPeople},
                        // long: {$inRange: [-123, -120]},
                        // day: 6,
                    })
                    .group({
                        $by: ['location', 'user'],
                        long: '$first',
                        lat: '$first',
                        count: '$count',
                        time: '$first'
                    })
                    (data.geo);

                    allGeoLocations.forEach(function(loc){
                        L.circle([loc.lat, loc.long], {
                            color: 'none',
                            fillColor: 'purple',
                            // weight: 1,
                            fillOpacity: 0.25,
                            radius: 150
                        }).addTo(gmap.relatedPeople);
                    })
                }
            })

            relationshipLayout.explore = function() {
                if(selectedPeople.length == 0) return;
                $("#button-relationship").removeClass('active')
                $("#button-geospatial").addClass('active')
                $("#page-relationship").transition('fade left');;
                $("#page-geospatial").transition('fade left');;

                var monthlyActivities = pipeline()
                .match({
                    user: {$in: selectedPeople.concat([selectedSubjectID])},
                })
                .group({
                    $by: ['month', 'user'],
                    count: {'location': '$count'}
                })
                .sortBy({month: 1})
                (data.geo);

                var tData = new Array(selectedPeople.length+1);
                selectedPeople = selectedPeople.concat([selectedSubjectID]);
                selectedPeople.forEach(function(s, i){
                    tData[i] = monthlyActivities
                        .filter(function(a) {
                            return a.user == s;
                        }).sort(function(a, b){
                            return b.month - a.month;
                        });
                })

                graph.nodes.forEach((d)=>(d.type="people"));

                var selectedGraph = {
                    nodes: graph.nodes.filter(function(d){return selectedPeople.indexOf(d.id) != -1;}),
                    links: graph.links.filter(function(d){return selectedPeople.indexOf(d.target.id) != -1 && selectedPeople.indexOf(d.source.id) != -1;})
                }

                var infoGraph = ontoGraph({
                    container: '#panel-ontograph-body',
                    width: geoViews.ontograph.innerWidth,
                    height: geoViews.ontograph.innerHeight,
                    domain: [d3.min(activityCounts), d3.max(activityCounts)],
                    graph: selectedGraph
                })

                gmap.onadd(function(d){
                    var c = d.coordinates,
                        cMinLat = Math.min(c[0].lat, c[1].lat),
                        cMaxLat = Math.max(c[0].lat, c[1].lat),
                        cMinLong = Math.min(c[0].lng, c[1].lng),
                        cMaxLong = Math.max(c[0].lng, c[1].lng);

                    var selectedLocations = allGeoLocations.filter(function(a){
                        return (a.lat < cMaxLat && a.lat > cMinLat && a.long < cMaxLong && a.long > cMinLong);
                    })
                    console.log(selectedLocations);
                    var links = pipeline()
                    .group({
                        $by: ['user'],
                        count: {'location': '$count'}
                    })
                    (selectedLocations);

                    console.log(links);

                    infoGraph.append({
                        nodes: {id: "Location 0", type: "geo", pos: [0,0], value: selectedLocations.length},
                        links: links
                    });
                })


                // var splot1 = new scatterPlot({
                //     container: geoViews.timeline.body,
                //     height: geoViews.timeline.innerHeight,
                //     width: geoViews.timeline.innerWidth / 2,
                //     padding: {left: 50, right: 10, top: 30, bottom: 50},
                //     data:  monthlyActivities,
                //     formatX: function(d) { return d;},
                //     // series: selectedPeople.concat([selectedSubjectID]),
                //     // zero: true,
                //     vmap: {
                //         x: 'month',
                //         y: 'user',
                //         size: 'count',
                //         color: 'group',
                //         // colorMap: function(d) {
                //         //     return (d == selectedSubjectID) ? 'teal' : 'purple';
                //         // }
                //         // color: 'user',
                //     }
                // })
                //
                // splot1.div.style.marginLeft =  geoViews.timeline.innerWidth / 2 + 'px';

                var hourActivities = pipeline()
                .match({
                    user: {$in: selectedPeople.concat([selectedSubjectID])},
                })

                .derive(function(d){
                    if(d.hour < 4)
                        d.hours = '0 - 4';
                    else if(d.hour < 8)
                        d.hours = '4 - 8';
                    else if(d.hour < 12)
                        d.hours = '8 - 12';
                    else if(d.hour < 16)
                        d.hours = '12 - 16';
                    else if(d.hour < 20)
                        d.hours = '16 - 20';
                    else
                        d.hours = '20 - 24';
                })
                .group({
                    $by: ['hours', 'user'],
                    count: {'location': '$count'}
                })
                .sortBy({hours: 1})
                (data.geo);

                var splot1 = new scatterPlot({
                    container: geoViews.timeline.body,
                    height: geoViews.timeline.innerHeight,
                    width: geoViews.timeline.innerWidth / 2,
                    padding: {left: 30, right: 50, top: 30, bottom: 50},
                    data:  hourActivities,
                    align: 'right',
                    formatX: function(d) { return d;},
                    title: 'Daily Activities',
                    colors: function(d) {
                        return (d == selectedSubjectID) ? 'teal' : 'purple';
                    },
                    onselect: function(d) {
                        var newNodeId = d;

                        var links = hourActivities.filter(function(a){
                            return a.hours == d;
                        });

                        var newNode = {
                            id: 'Hours: ' + newNodeId,
                            type: 'time',
                            pos: [0, geoViews.ontograph.innerHeight],
                            value: links.map((d)=>d.count).reduce((a,b)=>a+b)
                        }

                        infoGraph.append({
                            nodes: newNode,
                            links: links
                        });
                    },
                    vmap: {
                        x: 'hours',
                        y: 'user',
                        size: 'count',
                        color: 'user',
                    }
                })

                splot1.div.style.marginLeft =  geoViews.timeline.innerWidth / 2 + 'px';
                splot1.div.style.float = 'right';
                var dayActivities = pipeline()
                .match({
                    user: {$in: selectedPeople.concat([selectedSubjectID])},
                })
                .group({
                    $by: ['day', 'user'],
                    count: {'location': '$count'}
                })
                (data.geo);

                var dayOfWeek_short = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa'],
                    dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                var splot1 = new scatterPlot({
                    container: geoViews.timeline.body,
                    height: geoViews.timeline.innerHeight,
                    width: geoViews.timeline.innerWidth / 2,
                    padding: {left: 50, right: 30, top: 30, bottom: 50},
                    data:  dayActivities,
                    onselect: function(d) {
                        var newNodeId = dayOfWeek[d];
                        var links = dayActivities.filter(function(a){
                            return a.day == d;
                        });

                        var newNode = {
                            id: newNodeId,
                            type: 'time',
                            pos: [0, geoViews.ontograph.innerHeight],
                            value: links.map((d)=>d.count).reduce((a,b)=>a+b)
                        }

                        infoGraph.append({
                            nodes: newNode,
                            links: links
                        });
                    },
                    formatX: function(d) { return dayOfWeek_short[d];},
                    title: 'Weekly Activities',
                    colors: function(d) {
                        console.log(d, selectedSubjectID);
                        return (d == selectedSubjectID) ? 'teal' : 'purple';
                    },

                    vmap: {
                        x: 'day',
                        y: 'user',
                        size: 'count',
                        color: 'user',
                    }
                })
                //
                // var activities = pipeline()
                // .match({
                //     user: {$in: selectedPeople.concat([selectedSubjectID])},
                // })
                // .group({
                //     $by:  ['user', 'year', 'month'],
                //     time: '$min',
                //     count: {'location': '$count'}
                // })
                // (data.geo);
                //
                // var tData = new Array(selectedPeople.length+1);
                // selectedPeople.concat([selectedSubjectID]).forEach(
                //         function(s, i){
                //     tData[i] = activities
                //         .filter(function(a) {
                //             return a.user == s;
                //         }).sort(function(a, b){
                //             return b.time - a.time;
                //         });
                // })
                // console.log(activities);
                // new lineChart({
                //     container: geoViews.timeline.body,
                //     height: geoViews.timeline.innerHeight,
                //     width: geoViews.timeline.innerWidth,
                //     padding: {left: 100, right: 50, top: 30, bottom: 50},
                //     data: tData,
                //     formatX: function(d) {
                //         return d.getFullYear() + '/' + d.getMonth();
                //     },
                //     // series: selectedPeople.concat([selectedSubjectID]),
                //     zero: true,
                //     vmap: {
                //         x: 'time',
                //         y: 'count',
                //         color: 'user',
                //         colorMap: function(d) {
                //             return (d == selectedSubjectID) ? 'teal' : 'purple';
                //         }
                //         // color: 'user',
                //     }
                // })
            }

            var monthlyActivities = pipeline()
            .derive(function(d){
                d.month = d.time.getMonth();
                d.year = d.time.getYear();
            })
            .match({
                user: selectedSubjectID,
            })
            .group({
                $by: ['month', 'year'],
                time: '$min',
                count: {'location': '$count'}
            })
            .sortBy({time: 1})
            (data.geo);

            temporalArea({
                container: '#panel-activity-body',
                data: monthlyActivities,
                width: relationshipLayout.views.activiity.innerWidth,
                height: relationshipLayout.views.activiity.innerHeight
            })
        })

    }

});
