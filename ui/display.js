define(function(require){
    var Layout = require('vastui/layout'),
        Panel = require('vastui/panel'),
        Button = require('vastui/button'),
        List = require('vastui/list');

    var iGraph = require('./ontology-graph');
    var colorScheme = require('./color-scheme');
    var gitTree = require('./gitTree')

    return function(webSocket, container, scale) {
        var container = container || 'page-main',
            scale = scale || 1;
        var appLayout = new Layout({
            margin: 10,
            container: container,
            cols: [
                {
                    width: 0.3,
                    id: 'col-left'
                },
                {
                    width: 0.7,
                    id: 'col-mid'
                },
                // {
                //     width: 0.2,
                //     id: 'col-right'
                // },
            ]
        });

        var views = {};

        views.left = new Panel({
            container: appLayout.cell('col-left'),
            id: "col-left-view",
            padding: 25,
            // style:{border: 0},
            // header: {height: 0.05, border: 0}
        });

        if(container == 'page-main')
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
            graph: {nodes: [], links: []},
            scale: scale,
        });

        var allGraphs = [];
        //July 26 will start here// Loglist means left-historylist
        //To add new history list and ontology response
        var logTree = new gitTree({
            container: views.left.body,
            header: "History",
            width: 300,
            height: 500,
            onselect: function(d){
                
            }
        })
        
        var logList = new List({
            container: views.left.body,
            header: "History",
            types: ['selection' , 'divided', 'single'],
            onselect: function(d) {
                console.log(allGraphs[d]);
                // ig.removeLinks({all:1})
                //     .removeNodes({all:1});
                // ig.remake(allGraphs[d])
            }
        })

        appLayout.views = views;

        webSocket.emit('large display', {});
        webSocket.on('update', function(data){
            data.logs.forEach(function(log){
                logList.append({
                    header: log.datetime + ' @' + log.user,
                    icon: 'big browser',
                    text: log.note
                })
            })
            allGraphs = allGraphs.concat(data.logs.map(function(d){return d.graph;}));
            var graphs = data.graphs,
                users = Object.keys(graphs),
                graph = {links: [], nodes:[]};

            if(users.length){
                // views.left.clear();
                for(var name in graphs) {
                    graph.nodes = graph.nodes.concat(graphs[name].nodes);
                    graph.links = graph.links.concat(graphs[name].links);
                    // var gg = iGraph({
                    //     container: views.left.body,
                    //     width: views.left.innerWidth,
                    //     height: views.left.innerWidth,
                    //     domain: [0, 1],
                    //     graphId: name + '_igraph',
                    //     colorScheme: colorScheme,
                    //     graph:  {links: [], nodes:[]},
                    //     graphName: name,
                    // });
                    // gg.remake(graphs[name])
                }
                ig.removeLinks({all:true});
                ig.remake(graph);
            }
        })
        return appLayout;
    }
})
