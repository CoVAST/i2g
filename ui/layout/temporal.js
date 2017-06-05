define(function(require){
    var Layout = require('vastui/layout'),
        Panel = require('vastui/panel'),
        Button = require('vastui/button'),
        ProgressBar = require('vastui/progress');

    return function() {
        var appLayout = new Layout({
            margin: 10,
            container: 'page-temporal',
            cols: [
                {
                    width: 0.7,
                    rows: [
                        {id: 'ontotime-view', height: 0.7},
                        {id: 'temporal-view', height: 0.3},
                    ]
                },
                {
                    width: 0.3,
                    rows: [
                        {id: 'stats-view'}
                    ]
                },
            ]
        });

        var views = {};

        views.stats = new Panel({
            container: appLayout.cell('stats-view'),
            id: "panel-stats",
            title: "Temporal Statistics",
            // style: {backgroundColor: '#222'},
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });

        views.timeline = new Panel({
            container: appLayout.cell('temporal-view'),
            id: "panel-temporal",
            title: "Temporal Overview",
            header: {height: 35, style: {backgroundColor: '#FFF'}}
        });

        views.ontotime = new Panel({
            container: appLayout.cell('ontotime-view'),
            id: "panel-ontotime",
        });

        appLayout.views = views;

        return appLayout;
    }

})
