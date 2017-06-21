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
                    width: 0.35,
                    id: 'col-left'
                },
                {
                    width: 0.65,
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



        // views.right = new Panel({
        //     container: appLayout.cell('col-right'),
        //     id: "col-right-view",
        //     // title: "Info Graph",
        //     // header: {height: 40, style: {backgroundColor: '#FFF'}}
        // });

        appLayout.views = views;

        webSocket.emit('large display', {});
        webSocket.on('update', function(data){
            console.log(data);
            var graphs = data.graphs,
                users = Object.keys(graphs),
                graph = {links: [], nodes:[]};

            if(users.length){
                views.left.clear();
                for(var name in graphs) {
                    graph.nodes = graph.nodes.concat(graphs[name].nodes);
                    graph.links = graph.links.concat(graphs[name].links);

                    var gg = iGraph({
                        container: views.left.body,
                        width: views.left.innerWidth,
                        height: views.left.innerWidth,
                        domain: [0, 1],
                        graphId: name + '_igraph',
                        colorScheme: colorScheme,
                        graph:  {links: [], nodes:[]}
                    });
                    gg.remake(graphs[name])
                }
                ig.removeLinks({all:true});
                ig.remake(graph);
            }
        })
        return appLayout;
    }
})
