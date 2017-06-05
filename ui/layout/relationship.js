define(function(require){
    var Layout = require('vastui/layout'),
        Panel = require('vastui/panel'),
        Button = require('vastui/button'),
        List = require('vastui/list'),
        ProgressBar = require('vastui/progress');

    return function() {
        var appLayout = new Layout({
            margin: 10,
            container: 'page-relationship',
            cols: [
                {
                    id: "subject-list",
                    width: 0.25
                },
                {
                    width: 0.5,
                    rows: [
                        {id: 'relationship-graph', height: 0.7},
                        {id: 'activity-graph', height: 0.3},
                    ]
                },
                {
                    width: 0.25,
                    rows: [
                        {id: "selection-list", height: 0.85},
                        {id: "control", height: 0.15}
                    ]
                },
            ]
        });

        var views = {};

        views.subject = new Panel({
            container: appLayout.cell('subject-list'),
            id: "panel-subject",
            title: "Subject List",
            padding: 10,
            // style: {backgroundColor: '#222'},
            header: {height: 40, style: {backgroundColor: '#FFF'}}
        });

        views.relationship = new Panel({
            container: appLayout.cell('relationship-graph'),
            id: "panel-relationship",
            title: "Relationship Graph",
            header: {height: 40, style: {backgroundColor: '#FFF'}}
        });

        views.selection = new Panel({
            padding: 20,
            container: appLayout.cell('selection-list'),
            id: "panel-selection",
            title: "Selected People",
            header: {height: 40, style: {backgroundColor: '#FFF'}}
        });

        views.activiity = new Panel({
            container: appLayout.cell('activity-graph'),
            id: "panel-activity",
            title: "Activity Plot",

            header: {height: 40, style: {backgroundColor: '#FFF'}}
        });

        views.control = new Panel({
            container: appLayout.cell('control'),
            id: "panel-control",
            padding: 30,
            style: {textAlign: 'center', verticalAlign: 'middle'}
        });

        views.subject.append('<div class="ui icon input fluid" ><input type="text" id="subject-search"  placeholder="Search..."><i id="subject-search-button" class="search link icon"></i></div>');

        $("#subject-search").change(function(){
            console.log(this.value);
        })

        var subjects = new List({
            container: views.subject.body,
            types: ['selection']
        })

        var selections = new List({
            container: views.selection.body,
            types: ['divided']
        })

        var resetButton = new Button({
            container: views.control.body,
            text: ' Clear List ',
            icon: 'remove',
            type: 'pink'
        })

        var nextButton = new Button({
            container: views.control.body,
            text: 'Explore Map',
            icon: 'map',
            type: 'teal',
            onclick: function(d) {
                if(typeof appLayout.explore == 'function') {
                    appLayout.explore();
                }
            }
        });

        appLayout.views = views;
        appLayout.subjects = subjects;
        appLayout.selections = selections;
        return appLayout;
    }

})
