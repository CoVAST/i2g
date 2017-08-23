define(function(require) {
    return function Comparator(arg){
        var myId = arg.uid || "DefaultUsername";
        /************ Initialization ************/
    	var comparator = {};
        var conflicts = {
            0: "[No conflict]",
            1: "[Node Removed]",
            2: "[Name Duplicated]",
            4: "[Neighbor Node Removed]"
            // 4: "[Relevant Node Removed]",
            // 8: "[Area Overlapped]", // TO BE DONE
            // 16: "[Time Overlapped]",
        };
        /************ Gloabal Variables ************/
        var conflictNodes = {};
        var conflictLinks = {};
        var removedNodes = [];
        var dependency = {};
        //ALL nodes and links in this file refers to concepts in ontology graphs
        
        /************ Local Functions ************/
        function nodeBelongTo(node, serverNodes){
            serverNodes = Array.isArray(serverNodes)? serverNodes : [serverNodes];
            for(var i = 0; i < serverNodes.length; i++){
                if(node.nodename === serverNodes[i].nodename && node.action === serverNodes[i].action){
                    return true;
                }
            }
            return false;
        }

        function linkBelongTo(link, serverLinks){
            serverLinks = Array.isArray(serverLinks)? serverLinks : [serverLinks];
            for(var i = 0; i < serverLinks.length; i++){
                if(isEqualNode(link.source, serverLinks[i].source) && isEqualNode(link.target, serverLinks[i].target)){
                    return true;
                }
            }
            return false;
        }

        function isEqualNode(nodeA, nodeB){
            return nodeBelongTo(nodeA, nodeB);
        }

        function isEqualLink(linkA, linkB){
            return linkBelongTo(linkA, linkB);
        }

        function compareNode(node, serverNodes){
            let nodeKey = node.action + "-" + node.nodename;
            if(removedNodes.indexOf(nodeKey) > -1) conflictNodes[nodeKey] = conflictNodes[nodeKey]? (conflictNodes[nodeKey] | 1) : 1;
            for(var i = 0; i < serverNodes.length; i++){
                if(node.nodename === serverNodes[i].nodename && node.action === serverNodes[i].action){
                    conflictNodes[nodeKey] = conflictNodes[nodeKey]? (conflictNodes[nodeKey] | 2) : 2;   //Name Duplicated
                }
            }
        }
        function compareLink(link, serverLinks){
            let linkKey = link.action + "-" + link.source.nodename + "-" + link.target.nodename;
            if(removedNodes.indexOf(link.target) > -1){
                conflictLinks[linkKey] = conflictLinks[linkKey]? (conflictLinks[linkKey] | 1) : 1;
                let nodeKey = link.source.action + "-" +link.source.nodename;
                conflictNodes[nodeKey] = conflictNodes[nodeKey]? (conflictNodes[nodeKey] | 4): 4;
            }else if(removedNodes.indexOf(link.source) > -1){
                conflictLinks[linkKey] = conflictLinks[linkKey]? (conflictLinks[linkKey] | 1) : 1;
                let nodeKey = link.target.action + "-" +link.target.nodename;
                conflictNodes[nodeKey] = conflictNodes[nodeKey]? (conflictNodes[nodeKey] | 4): 4;
            }
            // for(var i = 0; i < serverLinks.length; i++){
            //     if(link.nodename === serverLinks[i].nodename){
            //         conflictLinks[linkKey] = conflictLinks[linkKey]? (conflictLinks[linkKey] | 2) : 2;   //Name Duplicated
            //     }
            // }
        }
        comparator.getConflictTree = function(){
            function explainConflict(value){
                let ret = "";
                for(var j = 4; j >= 1; j = j / 2){
                    if(value & j) ret = ret + conflicts[j];
                }
                return ret;
            }
            let rst = [];
            for(var i in conflictNodes){
                console.log(i);
                rst.push({node: i, conflict: conflictNodes[i], conflictReason: explainConflict(conflictNodes[i]), dependency: dependency[i]});
            }
            for(var i in conflictLinks){
                rst.push({link: i, conflict: conflictNodes[i], conflictReason: explainConflict(conflictLinks[i]), dependency: dependency[i]});
            }
            return rst;
        }

        function hasPullCriticalChange(pullState, serverList){
            if(pullState.action === "Merge"){
                let removing = [];
                let mergeInfo = pullState.mergeInfo;
                for(var i = 0; i < mergeInfo.length; i++){
                    if(mergeInfo[i].node.action.indexOf("Remove") > -1){
                        removing.push(mergeInfo[i].node.nodename);
                    }
                }
                for(var i = 0; i < mergeInfo.length; i++){
                    if(mergeInfo[i].node.action.indexOf("Add") > -1){
                        let pos = removing.indexOf(mergeInfo[i].node.nodename)
                        if(pos > -1){
                            removing.splice(pos, 1);
                        }else{
                            if(mergeInfo[i].node.action.indexOf("node") > -1){
                                if(nodeBelongTo(mergeInfo[i].node, serverList.nodes) === false){
                                    removedNodes.push(mergeInfo[i].node.nodename);
                                    let key = mergeInfo[i].node.action + "-" + mergeInfo[i].node.nodename;
                                    conflictNodes[key] = conflictNodes[key]? conflictNodes[key] | 1 : 1;
                                    dependency[key] = {trunk: mergeInfo[i], branches: []};
                                    mergeInfo[i].conflict = true;
                                }
                            }else if(mergeInfo[i].node.action.indexOf("link") > -1){
                                if(linkBelongTo(mergeInfo[i].node, serverList.links) === false){
                                    removedNodes.push(mergeInfo[i].node.nodename);
                                    let key = mergeInfo[i].node.action + "-" + mergeInfo[i].node.nodename;
                                    conflictNodes[key] = conflictNodes[key]? conflictNodes[key] | 1 : 1;
                                    dependency[key] = {trunk: mergeInfo[i], branches: []};
                                    mergeInfo.conflict = true;
                                }
                            }
                        }
                    }
                }
                if(Object.keys(conflictLinks).length > 0 || Object.keys(conflictNodes).length > 0){
                    console.log(Object.keys(conflictNodes));
                    console.log(Object.keys(conflictLinks));
                    return true;
                }else{
                    return false;
                }
            }else if(pullState.action === "Root"){
                return false;
            }else{
                console.log("Unexpected action of pullState.");
                return true;
            }
        }

        function CheckDependency(localList){
            for(var i = 0; i < localList.nodes.length; i++){
                let key = localList.nodes[i].action + "-" + localList.nodes[i].nodename;
                if(conflictNodes[key]){
                    if(conflictNodes[key] & 1){ //Node Removed
                        
                    }
                    if(conflictNodes[key] & 2){//Name duplicate
                        dependency[key] = {dupNode: localList.nodes[i]};
                    }
                    if(conflictLinks[key] & 4){//Neighborhood node removed

                    }
                }
            }
            for(var i = 0; i < localList.links.length; i++){
                let srcKey = "Add node" + "-" + localList.links[i].source.label;
                if(conflictNodes[srcKey]){
                    if(conflictNodes[srcKey] & 1){ //Node Removed
                        dependency[srcKey].branches.push(localList.links[i]);
                    }
                    if(conflictNodes[srcKey] & 2){//Name duplicate
                        dependency[srcKey] = {duplink: localList.links[i]};
                    }
                    if(conflictLinks[srcKey] & 4){//Neighborhood node removed

                    }
                }
                
                let tarKey = "Add node" + "-" + localList.links[i].target.label;
                if(conflictNodes[tarKey]){
                    if(conflictNodes[tarKey] & 1){ //Node Removed
                        dependency[tarKey].branches.push(localList.links[i]);
                    }
                    if(conflictNodes[tarKey] & 2){//Name duplicate
                        dependency[srcKey] = {duplink: localList.links[i]};
                    }
                    if(conflictLinks[tarKey] & 4){//Neighborhood node removed

                    }
                }
            }
            return true;
        }

        comparator.getCompareResult = function(pullState, serverRawList){
            let serverList = {
                nodes: [],
                links: []
            }
            for(var i = 0; i < serverRawList.length; i++){
                if(serverRawList[i].action.indexOf("node") > -1){
                    serverList.nodes.push(serverRawList[i]);
                }else if(serverRawList[i].action.indexOf("link") > -1){
                    serverList.links.push(serverRawList[i]);
                }else if(serverRawList[i].action === "Merge"){
                    console.log("Unexpected Merge in ServerRawList");
                }
            }
            conflictNodes = {};
            conflictLinks = {};
            removedNodes = [];
            let localList = {
                nodes: [],
                links: []
            }
            let curNode = pullState;
            let leafNode = null;
            while(curNode){
                if(curNode.action === "Merge"){
                    // for(var i = 0; i < curNode.mergeInfo.length; i++){
                    //     if(curNode.action.indexOf("node") > -1){
                    //         localList.nodes.push(curNode);
                    //     }else if(curNode.action.indexOf("link") > -1){
                    //         localList.links.push(curNode);
                    //     }
                    // }
                    // curNode = curNode.children[0];
                }else if(curNode.action.indexOf("node") > -1){
                    localList.nodes.push(curNode);
                }else if(curNode.action.indexOf("link") > -1){
                    localList.links.push(curNode);
                }
                leafNode = curNode;
                curNode = curNode.children[0];
            }
            let rst1 = hasPullCriticalChange(pullState, serverList);
            let rst2 = CheckDependency(localList);
            if(rst1 && rst2){
                console.log("Pull state problem");
            }else{
                for(var i = 0; i < localList.nodes.length; i++){
                    compareNode(localList.nodes[i], serverList.nodes);
                }

                for(var i = 0; i < localList.links.length; i++){
                    compareNode(localList.links[i], serverList.links);
                }
            }
            CheckDependency(localList);
            for(var i in dependency){
                if(dependency[i].branches){
                    let dset = new Set(dependency[i].branches);
                    dependency[i].branches = Array.from(dset);
                }
            }
            return {conflictNodes: conflictNodes, conflictLinks: conflictLinks, leafNode: leafNode};
        }
    	return comparator;
    }
})
 