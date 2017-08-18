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
            header: {height: 0.07, style: {backgroundColor: '#FFF'}},
            title: "Tree Provenance",
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

        var logTree = new gitTree({
            container: views.left.body,
            width: parseInt(views.left.body.style.width),
            height: parseInt(views.left.body.style.height),
            id: "collaboration",
        })
        

        var ig = iGraph({
            container: views.mid.body,
            width: views.mid.innerWidth,
            height: views.mid.innerHeight,
            domain: [0, 1],
            colorScheme: colorScheme,
            historyList: logTree,
            graph: {nodes: [], links: []},
            scale: scale,
        });

        logTree.setIgraphLocalState = function(node){
            ig.setLocalState(node);
        }

        logTree.onIGraphBuild = function(infos, curNode, not_reset){
            ig.setLocalState(curNode);
            if(!not_reset){ig.allReset();}
            infos = Array.isArray(infos)? infos : [infos];
            ig.switchHist("off");
            let collector = [];
            for(var i = 0; i < infos.length; i++){
                if(infos[i].action === "Merge"){
                    collector = collector.concat(infos[i].mergeInfo.map((k) => {return k.node;}).reverse());
                }else{
                    collector.push(infos[i]);
                }
            }
            let set = new Set(collector);
            collector = Array.from(set);
            collector.sort((a, b)=>{
                return a.nodeId - b.nodeId;
            })  
            for(var i = 0; i < collector.length; i++){
                let info = collector[i];
                if(info.action === "Add link"){
                    ig.addLinks({
                        source: info.source,
                        target: info.target,
                        // value: 2,
                        // datalink: false
                    });
                }else if(info.action === "Add node"){
                    ig.addNodes({
                        label: info.nodename,
                        reason: info.reason,
                        labelPrefix: '',
                        icon: info.type,
                        type: info.type,
                        pos: [100,100],
                        // visData: visData,
                        // value: value
                    });
                }else if(info.action === "Remove link"){
                    ig.removeLinks({source: info.source.label, target: info.target.label})  
                }else if(info.action === "Remove node"){
                    ig.removeNodes({label: info.nodename});
                }else if(info.action === "Merge"){
                    console.log("No merge is expected.");
                }
            }
            ig.switchHist("on");
            ig.update();
        }

        logTree.pullToIndividial = function(info){
            if(info.action.indexOf("Root") > -1 || info.action.indexOf("Merge") > -1){
                console.log(info);
                let save = info.children;
                let save2 = info.fathers;
                let save3 = [];
                info.children = [];
                info.fathers = [];
                if(info.mergeInfo){
                    for(var i = 0; i < info.mergeInfo.length; i++){
                        save3.push({fathers: info.mergeInfo[i].node.fathers, children: info.mergeInfo[i].node.children});
                        info.mergeInfo[i].node.fathers = [];
                        info.mergeInfo[i].node.children = [];
                    }
                }
                webSocket.emit('pullRequest', info);
                info.children = save;
                info.fathers = save2;
                if(info.mergeInfo){
                    for(var i = 0; i < info.mergeInfo.length; i++){
                        info.mergeInfo[i].node.fathers = save3[i].fathers;
                        info.mergeInfo[i].node.children = save3[i].children;
                    }
                }
                return true;
            }else{
                return false;
            }
        }
        views.left.header.append(new Button({
            label: 'Pull',
            types: ['teal', 'large'],
            size: '12px',
            onclick: function() {
                logTree.onClickPull();
            }
        }))
        views.left.header.append(new Button({
            label: 'Merge',
            types: ['blue', 'large'],
            size: '12px',
            onclick: function() {
                logTree.onClickMerge();
            }
        }))

        appLayout.views = views;

        webSocket.emit('large display', {});
        webSocket.on('update', function(datas){
            console.log(datas.logs);
            let logs = Array.isArray(datas.logs)? datas.logs : [datas.logs];
            for(var j = 0; j < logs.length; j++){
                var tempInfos = [];
                for(var i = 0; i < logs[j].increments.length; i++){
                    if(logs[j].increments[i].action.indexOf("node") !== -1){
                        tempInfos.push({
                            action: logs[j].increments[i].action,
                            reason: logs[j].increments[i].reason,
                            nodename: logs[j].increments[i].nodename,
                            type: logs[j].increments[i].type,
                            duration: logs[j].increments[i].duration || 200,
                            data: logs[j].increments[i].data || null,
                            datetime: logs[j].increments[i].datetime || new Date()
                        });
                    }else{
                        tempInfos.push({
                            action: logs[j].increments[i].action,
                            source: logs[j].increments[i].source,
                            target: logs[j].increments[i].target,
                            reason: logs[j].increments[i].reason || "Relevant",
                            nodename: logs[j].increments[i].nodename,
                            data: "Link",
                            duration: logs[j].increments[i].duration || 200,
                            datetime: logs[j].increments[i].datetime || new Date()
                        }); 
                    }
                }
                let curNode = null;
                curNode = logTree.insert((curNode !== null)? curNode : logs[j].pullNodename, { 
                    datetime: logs[j].datetime,
                    commitReason: logs[j].commitReason,
                    userId: logs[j].userId,
                    nodesInfo: tempInfos
                });
                // logTree.setLastMerge(logTree.merge([logTree.getLastMerge(), curNode], "Merge"));
            }
            logTree.refresh();

        });
        return appLayout;
    }
})
