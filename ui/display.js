define(function(require){
    var Layout = require('vastui/layout'),
        Panel = require('vastui/panel'),
        Button = require('vastui/button');

    var iGraph = require('./ontology-graph');
    var colorScheme = require('./color-scheme');

    return function(webSocket) {
        var appLayout = new Layout({
            margin: 10,
            container: 'page-main',
            cols: [
                {
                    width: 0.2,
                    id: 'col-left'
                },
                {
                    width: 0.6,
                    id: 'col-mid'
                },
                {
                    width: 0.2,
                    id: 'col-right'
                },
            ]
        });

        var views = {};

        views.left = new Panel({
            container: appLayout.cell('col-left'),
            id: "col-left-view",
            // style:{border: 0},
            // header: {height: 0.05, border: 0}
        });

        views.left.append('<h1 style="text-align:center; color:teal;">CoVA</h1>');

        views.mid = new Panel({
            container: appLayout.cell('col-mid'),
            id: "col-mid-view",

        });

        var ig = iGraph({
            container: views.mid.body,
            width: views.mid.innerWidth,
            height: views.mid.innerHeight,
            domain: [0, 1],
            colorScheme: colorScheme,
            graph: {nodes: [], links: []}
        });


        views.right = new Panel({
            container: appLayout.cell('col-right'),
            id: "col-right-view",
            // title: "Info Graph",
            // header: {height: 40, style: {backgroundColor: '#FFF'}}
        });

        appLayout.views = views;


        webSocket.emit('large display', {});
        webSocket.on('update', function(graph){
            console.log(graph);
            ig.remake(graph);
        })

        // layouts.people = new Layout({
        //     margin: 10,
        //     id: 'view-people',
        //     container: "domain-vis",
        //     cols: [
        //         {
        //             width: 0.5,
        //             id: 'view-people-subject'
        //         },
        //         {
        //             width: 0.5,
        //             id: 'view-people-related'
        //         },
        //     ]
        // })

        // layouts.datetime = new Layout({
        //     margin: 10,
        //     id: 'view-datetime',
        //     container: "domain-vis",
        //     rows: [
        //         {
        //             width: 0.7,
        //             id: 'view-datetime-stats'
        //         },
        //         {
        //             width: 0.3,
        //             id: 'view-datetime-plot'
        //         },
        //     ]
        // })

        // layouts.location = new Layout({
        //     margin: 10,
        //     container: "domain-vis",
        //     rows: [
        //         {
        //             width: 0.7,
        //             id: 'view-locaiton-map'
        //         },
        //         {
        //             width: 0.3,
        //             id: 'view-location-datetime'
        //         },
        //     ]
        // })

        // layouts.provenance = new Layout({
        //     margin: 10,
        //     container: "domain-vis"
        // })

        return appLayout;
    }
})
