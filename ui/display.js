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

        var logTree = new gitTree({
            container: views.left.body,
            header: "History",
            width: 300,
            height: 500,
            onselect: function(d){
                
            }
        })

        appLayout.views = views;

        webSocket.emit('large display', {});
        webSocket.on('update', function(datas){
            console.log(datas.logs);
            let logs = Array.isArray(datas.logs)? datas.logs : [datas.logs];
            for(var j = 0; j < logs.length; j++){
                var tempInfos = [];
                for(var i = 0; i < logs[j].increments.length; i++){
                    if(logs[j].increments[i].hist.action.indexOf("node") !== -1){
                        tempInfos.push({
                            action: logs[j].increments[i].hist.action,
                            reason: logs[j].increments[i].hist.data.reason,
                            nodename: logs[j].increments[i].hist.data.label,
                            duration: logs[j].increments[i].hist.data.duration || 200,
                            data: logs[j].increments[i].hist.data.visData.curData || null,
                            datetime: logs[j].increments[i].hist.data.datetime || "2017-XX-XX"
                        });
                    }else{
                        tempInfos.push({
                            action: logs[j].increments[i].hist.action,
                            reason: logs[j].increments[i].hist.data.reason || "Relevant",
                            nodename: logs[j].increments[i].hist.data.label,
                            data: "Link",
                            duration: logs[j].increments[i].hist.data.duration || 200,
                            datetime: logs[j].increments[i].hist.data.datetime || "2017-XX-XX"
                        });
                    }
                }
                logTree.insert(0, {  //0 : pull state
                    datetime: logs[j].datetime,
                    commitReason: logs[j].commitReason,
                    userId: logs[j].userId,
                    nodesInfo: tempInfos
                });
            }
            

        });
        return appLayout;
    }
})
