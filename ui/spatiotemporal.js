define(function(require){
    var Layout = require('vastui/layout'),
        Panel = require('vastui/panel'),
        Button = require('vastui/button');

    var pipeline = require('p4/core/pipeline');

    var geoMap = require('./geomap'),
        temporalPlot = require('./temporal-plot');

    return function(arg) {
        var options = arg || {},
            data = options.data || [];

        var appLayout = new Layout({
            margin: 10,
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

        views.map = new Panel({
            container: appLayout.cell('map-view'),
            id: "map",
            title: "Locations",
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });


        appLayout.map = geoMap({
            mapCenter: options.mapCenter,
            mapZoom: options.mapZoom
        });
        appLayout.views = views;


        appLayout.updateTimeline = function(arg) {
            var options = arg ||  {},
                data = options.data,
                people = options.people,
                onSelect = options.onselect;

            views.timeline.clear();

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
                width: views.timeline.innerWidth / 2,
                padding: {left: 30, right: 50, top: 30, bottom: 70},
                data:  weeklyStats,
                title: 'Weekly Activities',
                align: 'right',
                domainX: dayOfWeek,
                colors: function(d) {
                    return 'purple';
                },
                onselect: function(d) {

                    var links = data.filter(function(a){
                    return a.dayStr == d;
                    });

                    var newNode = {
                        id: d,
                        type: 'time',
                        pos: [0, views.map.innerHeight],
                        value: links.map((d)=>d.count).reduce((a,b)=>a+b)
                    }
                    onSelect({day: d}, newNode);
                },
                vmap: {
                    x: 'dayStr',
                    y: 'user',
                    size: 'count',
                    color: 'user',
                }
            })

            var dailyStats = pipeline()
            .match({
                user: {$in: people},
            })
            .derive(function(d){
                if(d.hour < 4)
                    d.hours = '0 - 3:59';
                else if(d.hour < 8)
                    d.hours = '4 - 7:59';
                else if(d.hour < 12)
                    d.hours = '8 - 11:59';
                else if(d.hour < 16)
                    d.hours = '12 - 15:59';
                else if(d.hour < 20)
                    d.hours = '16 - 19:59';
                else
                    d.hours = '20 - 23:59';
            })
            .group({
                $by: ['hours', 'user'],
                count: {'location': '$count'}
            })
            .sortBy({hours: 1})
            (data);

            var splot2 = new temporalPlot({
                container: views.timeline.body,
                height: views.timeline.innerHeight,
                width: views.timeline.innerWidth / 2,
                padding: {left: 50, right: 30, top: 30, bottom: 70},
                data:  dailyStats,
                align: 'left',
                formatX: function(d) { return d;},
                title: 'Daily Activities',
                colors: function(d) {
                    return 'purple';
                },
                onselect: function(d) {
                    var newNodeId = d;

                    var links = dailyStats.filter(function(a){
                        return a.hours == d;
                    });

                    var newNode = {
                        id: newNodeId,
                        type: 'time',
                        pos: [0, views.map.innerHeight],
                        value: links.map((d)=>d.count).reduce((a,b)=>a+b)
                    }

                    onSelect({hours: d}, newNode);

                },
                vmap: {
                    x: 'hours',
                    y: 'user',
                    size: 'count',
                    color: 'user',
                }
            })

            splot1.div.style.marginLeft =  views.timeline.innerWidth / 2 + 'px';
            splot1.div.style.float = 'right';
        }

        return appLayout;
    }

})
