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
            for(var i = 0; i < serverLinks.length; i++){
                if(link.nodename === serverLinks[i].nodename){
                    conflictLinks[linkKey] = conflictLinks[linkKey]? (conflictLinks[linkKey] | 2) : 2;   //Name Duplicated
                }
            }
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
                rst.push({node: i, conflict: conflictNodes[i], conflictReason: explainConflict(conflictNodes[i])});
            }
            for(var i in conflictLinks){
                rst.push({link: i, conflict: conflictNodes[i], conflictReason: explainConflict(conflictLinks[i])});
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
                                    conflictNodes[mergeInfo[i].node.action + "-" + mergeInfo[i].node.nodename] |= 1;
                                }
                            }else if(mergeInfo[i].node.action.indexOf("link") > -1){
                                if(linkBelongTo(mergeInfo[i].node, serverList.links) === false){
                                    removedNodes.push(mergeInfo[i].node.nodename);
                                    conflictNodes[mergeInfo[i].node.action + "-" + mergeInfo[i].node.nodename] |= 1;
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

        function hasAddOnHanldeConflict(localList){
            for(var i = 0; i < localList.nodes.length; i++){
                if(conflictNodes[localList.nodes[i].nodename]){
                    if(conflictNodes[localList.nodes[i]] & 1){ //Name dumplicate

                    }
                    if(conflictNodes[localList.nodes[i]] & 2){//Node Removed

                    }
                    if(conflictLinks[localList.nodes[i]] & 4){//Neighborhood node removed

                    }
                }
            }
            for(var i = 0; i < localList.links.length; i++){

            }
            return false;
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
            let rst2 = hasAddOnHanldeConflict(localList);
            if(rst1 === true && rst2 === false){
                console.log("Pull state problem");
            }else{
                for(var i = 0; i < localList.nodes.length; i++){
                    compareNode(localList.nodes[i], serverList.nodes);
                }

                for(var i = 0; i < localList.links.length; i++){
                    compareNode(localList.links[i], serverList.links);
                }
            }
            return {conflictNodes: conflictNodes, conflictLinks: conflictLinks, leafNode: leafNode};
        }
    	return comparator;
    }
})
