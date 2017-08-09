define(function(require){
    var Layout = require('vastui/layout'),
        Panel = require('vastui/panel'),
        Button = require('vastui/button');

    return function() {
        var appLayout = new Layout({
            margin: 10,
            padding: 0,
            container: 'page-main',
            cols: [
                {
                    width: 0.25,
                    id: 'page-left'
                },
                {
                    width: 0.4,
                    id: 'page-middle'
                },
                {
                    width: 0.35,
                    id: 'page-right'
                },
            ]
        });

        var views = {};

        views.left = new Panel({
            container: appLayout.cell('page-left'),
            id: "page-left-view",
            style: {
                border: 'unset',
                boxShadow: 'unset',
                overflow: 'unset'
            }
        });

        views.middle = new Panel({
            container: appLayout.cell('page-middle'),
            id: "page-middle-view",
            style: {
                border: 'unset',
                boxShadow: 'unset',
                overflow: 'unset'
            }
            // title: "Detail View",
            // header: {height: 35, style: {backgroundColor: '#FFF'}}
        });

        views.right = new Panel({
            container: appLayout.cell('page-right'),
            id: "page-right-view",
            style: {
                border: 'unset',
                boxShadow: 'unset',
                overflow: 'unset'
            }
            // title: "Info Graph",
            // header: {height: 40, style: {backgroundColor: '#FFF'}}
        });

        appLayout.views = views;


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
