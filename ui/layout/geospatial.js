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
                    width: 0.5,
                    rows: [
                        {id: 'map-view', height: 0.7},
                        {id: 'timeline-view', height: 0.3},
                    ]
                },
                {
                    width: 0.5,
                    rows: [
                        {id: 'ontograph-view', height: 0.7},
                        {id: 'detail-view', height: 0.3}
                    ]
                },
            ]
        });

        var views = {};

        views.detail = new Panel({
            container: appLayout.cell('detail-view'),
            id: "panel-detail",
            title: "History and Provenance",
            // style: {backgroundColor: '#222'},
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });

        views.timeline = new Panel({
            container: appLayout.cell('timeline-view'),
            id: "panel-timeline",
            title: "Time Domain",
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });

        views.map = new Panel({
            container: appLayout.cell('map-view'),
            id: "map",
            title: "Locations",
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });

        views.ontograph = new Panel({
            container: appLayout.cell('ontograph-view'),
            id: "panel-ontograph",
            title: "Concept Map",
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });

        appLayout.views = views;

        return appLayout;
    }

})
