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
            padding: 0,
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
        
        logTree.datas = null;

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
                // "remove" after "add" a.action > b.action
                // "link" after "node" a.action < b.action
                if(a.action.indexOf("Remove") > -1 && b.action.indexOf("Remove") > -1){
                    return a.action < b.action;
                }else if(a.action.indexOf("Remove") > -1){
                    return true;    //a.action greater
                }else if(b.action.indexOf("Remove") > -1){
                    return false;   //b.action greater
                }else{  //both add
                    return a.action < b.action;
                }
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
            if(Array.isArray(info)) info = info[0];
            console.log(info);
            let save = info.children;
            let save2 = info.fathers;
            let save3 = [];
            info.children = [];
            info.fathers = [];
            let lastId = 0;
            if(info.mergeInfo){
                for(var i = 0; i < info.mergeInfo.length; i++){
                    if(lastId < info.mergeInfo[i].node.nodeId){
                        lastId = info.mergeInfo[i].node.nodeId;
                        info.lastNode = info.mergeInfo[i].node;
                    }
                }
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
            console.log(datas.logs, datas.provIdDict);
            logTree.datas = datas;
            let logs = Array.isArray(datas.logs)? datas.logs : [datas.logs];
            for(var j = 0; j < logs.length; j++){
                var tempInfos = [];
                let conflicts = [];
                for(var i = 0; i < logs[j].increments.length; i++){
                    if(logs[j].increments[i].action.indexOf("node") !== -1){
                        tempInfos.push({
                            action: logs[j].increments[i].action,
                            reason: logs[j].increments[i].reason,
                            nodename: logs[j].increments[i].nodename,
                            type: logs[j].increments[i].type,
                            duration: logs[j].increments[i].duration || 200,
                            data: logs[j].increments[i].data || null,
                            datetime: logs[j].increments[i].datetime || new Date(),
                            serverId: logs[j].serverId,
                        });
                    }else if(logs[j].increments[i].action.indexOf("link") !== -1){
                        tempInfos.push({
                            action: logs[j].increments[i].action,
                            source: logs[j].increments[i].source,
                            target: logs[j].increments[i].target,
                            reason: logs[j].increments[i].reason || "Relevant",
                            nodename: logs[j].increments[i].nodename,
                            data: "Link",
                            duration: logs[j].increments[i].duration || 200,
                            datetime: logs[j].increments[i].datetime || new Date(),
                            serverId: logs[j].serverId,
                        }); 
                    }else if(logs[j].increments[i].action.indexOf("Conflict") !== -1){
                        conflicts.push(logs[j].increments[i]);
                    }
                }
                let curNode = null;
                if(tempInfos.length > 0){
                    curNode = logTree.insert(logs[j].pullNodeServerId, { 
                        datetime: logs[j].datetime,
                        commitReason: logs[j].commitReason,
                        userId: logs[j].userId,
                        nodesInfo: tempInfos,
                    });
                }

                // logTree.setLastMerge(logTree.merge([logTree.getLastMerge(), curNode], "Merge"));
                if(conflicts.length > 1){
                    let cnode = logTree.setLastMerge(logTree.merge({
                        isConflict: true,
                        node: conflicts[0]
                    }))

                    for(var i = 1; i < conflicts.length; i++){
                        cnode = cnode.checkout(conflicts[i]);
                    }
                }
                if(logs[j].waitMore === false && logTree.getLeafNodes().length >= 2){
                    logTree.setLastMerge(logTree.merge(logTree.getLeafNodes(), logs[j].commitReason));
                    if(datas.isPush === true){
                        logTree.pullToIndividial(logTree.getLastMerge());
                    }
                
                }else if(logs[j].waitMore === false && logTree.getLeafNodes().length === 1){
                    if(datas.isPush === true){
                        logTree.pullToIndividial(logTree.getLeafNodes());
                    }
                }
            }
            logTree.refresh();

        });
        return appLayout;
    }
})
