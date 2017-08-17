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
        function compareNode(node, serverNodes){
            if(removedNodes.indexOf(node) > -1) conflictNodes[node] = conflictNodes[node]? (conflictNodes[node] | 1) : 1;
            for(var i = 0; i < serverNodes.length; i++){
                if(node.nodename === serverNodes[i].nodename && node.action === serverNodes[i].action){
                    conflictNodes[node] = conflictNodes[node]? (conflictNodes[node] | 2) : 2;   //Name Duplicated
                }
            }
        }
        function compareLink(link, serverLinks){
            if(removedNodes.indexOf(link.target) > -1){
                conflictLinks[link] = conflictLinks[link]? (conflictLinks[link] | 1) : 1;
                conflictNodes[link.source] = conflictNodes[link.source]? (conflictNodes[link.source] | 4): 4;
            }else if(removedNodes.indexOf(link.source) > -1){
                conflictLinks[link] = conflictLinks[link]? (conflictLinks[link] | 1) : 1;
                conflictNodes[link.target] = conflictNodes[link.target]? (conflictNodes[link.target] | 4): 4;
            }
            for(var i = 0; i < serverLinks.length; i++){
                if(link.nodename === serverLinks[i].nodename){
                    conflictLinks[link] = conflictLinks[link]? (conflictLinks[link] | 2) : 2;   //Name Duplicated
                }
            }
        }
        function getConflictTree(){
            function explainConflict(value){
                let ret = "";
                for(var j = 4; j >= 1; j = j / 2){
                    if(value & j) ret = ret + conflicts[j];
                }
            }
            let rst = [];
            for(var i in conflictNodes){
                rst.push({node: i, conflictReason: explainConflict(conflictNodes[i])});
            }
            for(var i in conflictLinks){
                rst.push({link: i, conflictReason: explainConflict(conflictLinks[i])});
            }
        }

        function checkPullStateAndGetNewLocalList(pullState, localList, serverList, localRoot){
            //LocalList's chronic order is required
            if(pullState === localRoot)return;
            for(var i = 0; i < localList.nodes.length; i++){
                let found = false;
                if(pullState.children.indexOf(localList.nodes[i]) > -1)break;
                for(var j = 0; j < serverList.nodes.length; j++){
                    if(serverList.nodes[j].nodename === localList.nodes[i].nodename){
                        found = true;
                        break;
                    }
                }
                if(found){
                    found = false;
                }else{
                    conflictNodes[localList.nodes[i]] = conflictNodes[localList.nodes[i]]? (conflictNodes[localList.nodes[i]] | 1) : 1;   //Node Removed
                    removedNodes.push(localList.nodes[i]);
                }
            }
            localList.nodes.splice(0, i);
        }
        comparator.getCompareResult = function(pullState, localRoot, serverRawList){  //Only for linear tree, which contains no branch, TODO get valid path - to find the valid path from root to leaf
            let serverList = {
                nodes: [],
                links: [],
            } // = {nodes, links}
            for(var i = 0; i < serverRawList.length; i++){
                if(serverRawList[i].action.indexOf("node") > -1){
                    serverList.nodes.push(serverRawList[i]);
                }else if(serverRawList[i].action.indexOf("link") > -1){
                    serverList.links.push(serverRawList[i]);
                }
            }
            conflictNodes = {};
            conflictLinks = {};
            removedNodes = [];
            
            let localList = {
                nodes: [],
                links: []
            };
            let curNode = localRoot;
            let leafNode = null;
            while(curNode){
                if(curNode.action.indexOf("node") > -1){
                    localList.nodes.push(curNode);
                }else if(curNode.action.indexOf("link") > -1){
                    localList.links.push(curNode);
                }
                leafNode = curNode;
                curNode = curNode.children[0];
            }

            checkPullStateAndGetNewLocalList(pullState, localList, serverList, localRoot);

            for(var i = 0; i < localList.nodes.length; i++){
                compareNode(localList.nodes[i], serverList.nodes);
            }

            for(var i = 0; i < localList.links.length; i++){
                compareNode(localList.links[i], serverList.links);
            }
            return {conflictNodes: conflictNodes, conflictLinks: conflictLinks, leafNode: leafNode};
        }
    	return comparator;
    }
})
