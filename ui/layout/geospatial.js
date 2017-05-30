define(function(require){
    var Layout = require('vastui/layout'),
        Panel = require('vastui/panel'),
        Button = require('vastui/button'),
        ProgressBar = require('vastui/progress');

    return function() {
        var appLayout = new Layout({
            margin: 10,
            container: 'page-geospatial',
            cols: [
                {
                    width: 0.7,
                    rows: [
                        {id: 'map-view', height: 0.7},
                        {id: 'timeline-view', height: 0.3},
                    ]
                },
                {
                    width: 0.3,
                    rows: [
                        {id: 'detail-view'}
                    ]
                },
            ]
        });

        var views = {};

        views.detail = new Panel({
            container: appLayout.cell('detail-view'),
            id: "panel-detail",
            title: "Metrics / Statistics",
            // style: {backgroundColor: '#222'},
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });

        views.timeline = new Panel({
            container: appLayout.cell('timeline-view'),
            id: "panel-timeline",
            title: "Timeline View",
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });

        views.map= new Panel({
            container: appLayout.cell('map-view'),
            id: "map",
        });

        appLayout.views = views;


        return appLayout;

    }

})
