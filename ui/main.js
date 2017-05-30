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
        format = require('i2v/format')('.2s');

    var relationGraph = require('./relation-graph'),
        temporalArea = require('./temporal-area');

    return function() {
        var relationshipLayout = require('./layout/relationship')(),
            relationViews = relationshipLayout.views;
        var geospatialLayout = require('./layout/geospatial')(),
            geoViews = geospatialLayout.views;

        var relatedPeople = new L.LayerGroup();
        var subjectLocations = new L.LayerGroup();
        var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> ' +
                '© <a href="http://mapbox.com">Mapbox</a>',
            mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoianBsaTEyMjEiLCJhIjoiY2oyM3B4NTcxMDAwbTMzc2M5eGltbzY0MyJ9.HD8mo8i8kawQNmrbZbYo-g';

        var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr}),
            streets  = L.tileLayer(mbUrl, {id: 'mapbox.streets',   attribution: mbAttr});

        // set map center at SF
        var map = L.map('map', {
            center: [37.830348, -122.386052],
            zoom: 12,
            layers: [grayscale, subjectLocations, relatedPeople]
        });

        var baseLayers = {
            "Grayscale": grayscale,
            "Streets": streets
        };

        var overlays = {
            "Subject Locations": subjectLocations,
            "Related People": relatedPeople
        };

        L.control.layers(baseLayers, overlays).addTo(map);
        map.on("zoomend", function(){
            console.log(map.getBounds());
        })

        // add marker on map
        var markCount = 0;
        map.on('dblclick', function(e){
            var marker = new L.marker(e.latlng).addTo(map);
            markCount += 1;
        });

        ajax.getAll([
            {url: '/data/test-relationship.csv', dataType: 'text'},
            {url: '/data/test-geo280k.csv', dataType: 'text'}
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
                    text: subjects[i].connection + ' connections, ' + activityTotal[i].count + ' activtiies'
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
                }).addTo(subjectLocations);
            })

            var nodes = [{id: selectedSubjectID, group: 0, value: activityTotal[selectedSubjectID].count}];
            nodes = nodes.concat(selectedSubject.map(function(d,i){return {id: d.target, group: 1, value: activityTotal[d.target].count};}));

            var nodeIDs = nodes.map(function(d){return d.id;})
            var graph = {
                nodes: nodes,
                links: data.relationship.filter(function(d){return nodeIDs.indexOf(d.source) != -1 && nodeIDs.indexOf(d.target)!=-1;})
            }

            relationshipLayout.selections.append({
                header: 'Subject ' + selectedSubjectID + ' (' + activityTotal[selectedSubjectID].count + ' activtiies)',
                icon: 'spy'
            })

            // console.log(selectedSubject, graph);
            var activityCounts = activityTotal.map(function(d){return d.count});

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
                                header: 'Related Person ' + d.id + ' (' + activityTotal[d.id].count + ' activtiies)',
                                icon: 'user purple'
                            })
                        }
                    }

                    var locations = pipeline()
                    .derive(function(d){
                        d.month = d.time.getMonth();
                        d.day = d.time.getDay();
                        d.hour = d.time.getHours();
                    })
                    .match({
                        user: {$in: selectedPeople},
                        long: {$inRange: [-123, -120]},
                        day: 6,
                    })
                    .group({
                        $by: 'location',
                        long: '$first',
                        lat: '$first',
                        count: '$count',
                        time: '$first'
                    })
                    (data.geo);

                    locations.forEach(function(loc){
                        L.circle([loc.lat, loc.long], {
                            color: 'none',
                            fillColor: 'purple',
                            // weight: 1,
                            fillOpacity: 0.25,
                            radius: 150
                        }).addTo(relatedPeople);
                    })
                    console.log(locations);
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
                selectedPeople.concat([selectedSubjectID]).forEach(function(s, i){
                    tData[i] = monthlyActivities.filter(function(a) { return a.user == s;}).sort(function(a, b){ return b.month - a.month;});
                })
                new lineChart({
                    container: geoViews.detail.body,
                    height: 250,
                    padding: {left: 100, right: 20, top: 30, bottom: 50},
                    data: tData,
                    formatX: function(d) { return d;},
                    // series: selectedPeople.concat([selectedSubjectID]),
                    zero: true,
                    vmap: {
                        x: 'month',
                        y: 'count',
                        color: 'user',
                        colorMap: function(d) { return (d == selectedSubjectID) ? 'teal' : 'purple'}
                        // color: 'user',
                    }
                })

                var hourActivities = pipeline()
                .match({
                    user: {$in: selectedPeople.concat([selectedSubjectID])},
                })
                .group({
                    $by: ['hour', 'user'],
                    count: {'location': '$count'}
                })
                (data.geo);

                var tData = new Array(selectedPeople.length+1);
                selectedPeople.concat([selectedSubjectID]).forEach(function(s, i){
                    tData[i] = hourActivities.filter(function(a) { return a.user == s;}).sort(function(a, b){ return b.hour - a.hour;});
                })

                new lineChart({
                    container: geoViews.detail.body,
                    height: 250,
                    padding: {left: 100, right: 20, top: 30, bottom: 50},
                    data: tData,
                    formatX: function(d) { return d;},
                    // series: selectedPeople.concat([selectedSubjectID]),
                    zero: true,
                    vmap: {
                        x: 'hour',
                        y: 'count',
                        color: 'user',
                        colorMap: function(d) { return (d == selectedSubjectID) ? 'teal' : 'purple'}
                        // color: 'user',
                    }
                })

                var dayActivities = pipeline()
                .match({
                    user: {$in: selectedPeople.concat([selectedSubjectID])},
                })
                .group({
                    $by: ['day', 'user'],
                    count: {'location': '$count'}
                })
                (data.geo);

                var tData = new Array(selectedPeople.length+1);
                selectedPeople.concat([selectedSubjectID]).forEach(function(s, i){
                    tData[i] = dayActivities.filter(function(a) { return a.user == s;}).sort(function(a, b){ return b.day - a.day;});
                })

                new lineChart({
                    container: geoViews.detail.body,
                    height: 250,
                    padding: {left: 100, right: 20, top: 30, bottom: 50},
                    data: tData,
                    formatX: function(d) { return d;},
                    // series: selectedPeople.concat([selectedSubjectID]),
                    zero: true,
                    vmap: {
                        x: 'day',
                        y: 'count',
                        color: 'user',
                        colorMap: function(d) { return (d == selectedSubjectID) ? 'teal' : 'purple'}
                        // color: 'user',
                    }
                })

                var activities = pipeline()
                .match({
                    user: {$in: selectedPeople.concat([selectedSubjectID])},
                })
                .group({
                    $by:  ['user', 'year', 'month'],
                    time: '$min',
                    count: {'location': '$count'}
                })
                (data.geo);

                var tData = new Array(selectedPeople.length+1);
                selectedPeople.concat([selectedSubjectID]).forEach(function(s, i){
                    tData[i] = activities.filter(function(a) { return a.user == s;}).sort(function(a, b){ return b.time - a.time;});
                })
                console.log(activities);
                new lineChart({
                    container: geoViews.timeline.body,
                    height: geoViews.timeline.innerHeight,
                    width: geoViews.timeline.innerWidth,
                    padding: {left: 100, right: 50, top: 30, bottom: 50},
                    data: tData,
                    formatX: function(d) { return d.getFullYear() + '/' + d.getMonth();},
                    // series: selectedPeople.concat([selectedSubjectID]),
                    zero: true,
                    vmap: {
                        x: 'time',
                        y: 'count',
                        color: 'user',
                        colorMap: function(d) { return (d == selectedSubjectID) ? 'teal' : 'purple'}
                        // color: 'user',
                    }
                })
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
