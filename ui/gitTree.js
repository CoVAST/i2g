define(function(require) {
    return function gitTree(arg){
        /************ Initialization ************/
        var options = arg || {},
            container = options.container || document.body,
            header = options.header,
            width = options.width,
            height = options.height,
            onselect = options.onselect;
        var svg = d3.select(container).append('svg:svg');
            // type = options.type,
            // selectedColor = options.selectedColor || 'black',
            // selectedIcon = options.selectedIcon || '',
            // types = options.types || [];
        svg.attr("width", width).attr("height", height);
        var nodeCounter = 0;
        width = width / 2;

        /************ Tree Structure ************/
        var Node = function(userId, fathers, action, duration, datetime, reason, nodename, type, source, target, linkname, datalink, value){
            // //Formatize fathers
            // //Calculate weight
            // var weight = 0.0;
            // if(!fathers) weight = 1;
            // else{
            //     fathers = Array.isArray(fathers)? fathers : [fathers];
            //     if(fathers.length === 1){
            //         weight = fathers[0].weight / fathers[0].children.length;
            //     }else{
            //         for(var i = 0; i < fathers.length; i++){
            //             weight += fathers[i].weight;
            //         }
            //     }
            // }
            if(fathers !== null){
                fathers = Array.isArray(fathers)? fathers : [fathers];
            }
            var node = {
                userId: userId,
                nodeId: nodeCounter++,
                position: {
                    x: null,
                    y: null
                },
                weight: 0,
                children: [],
                fathers: fathers,
                action: action,
                duration: duration,
                datetime: datetime,
                reason: reason,
                type: type,
                nodename: nodename,
                source: source,
                target: target,
                linkname: linkname,
                datalink: datalink,
                value: value
            }
            node.checkout = function(info){
                return graph.checkout(node, info);
            }
            return node;
        }

        /************ Global Parameters ************/
        var Root = new Node(0, null, "Root", 0, null, null, "Root", "Root", null, null, null, null, null);    // Mark 0 as root/merge/...(which is structural-part) node
        var RecalPos = true;
        var fullVerticalStep = 20;
        var graph = svg;
        graph.Root = Root;
        var durationStepConst = 0.01;   //Every (1/durationStepConst) second means 1 Step
        
        var Repository = [];
        var stampId = 0;    //Each merge creates a timestamp
        var isPulling = false;
        var isMerging = false;
        var CurShowNode = Root;
        repoSave(); //Initial saving

        /************ Private Functions ************/
        function repoSave(){
            let str = JSON.stringify(Root);
            let restore = JSON.parse(str);
            Repository[stampId] = restore;
            stampId++;
        }

        function refillWeightFrom(node){
            if(!node.fathers) node.weight = 1;
            else if(node.fathers.length === 1){
                node.weight = node.fathers[0].weight / node.fathers[0].children.length;
            }else{
                node.weight = 0;
                for(var i = 0; i < node.fathers.length; i++){
                    node.weight += node.fathers[i].weight;
                }
            }
            for(var i = 0; i < node.children.length; i++){
                refillWeightFrom(node.children[i]);
            }
        }

        function colorAlloc(nodeId) {
            //Google ten
            var color_g20_addBlack = [   "#000000", "#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", 
                                "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", 
                                "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", 
                                "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"   ];
            if(nodeId > color_g20_addBlack) {
                console.log("Too many ids. Colors aren't enough.");
                return "black";
            }
            return color_g20_addBlack[nodeId];
        }

        function findNodeByIdFrom(nodeId, node){
            var curNode = node;
            if(curNode.nodeId === nodeId){
                return curNode;
            }else{
                for(var i = 0; i < curNode.children.length; i++){
                    let rst = findNodeByIdFrom(nodeId, curNode.children[i]);
                    if(rst != null) return rst;
                }
            }
            return null;
        }
        function findNodesByUserIdFrom(userId, node){
            var curNode = node;
            var rstArray = [];
            if(curNode.userId === userId){
                rstArray.push(node);
            }
            for(var i = 0; i < curNode.children.length; i++){
                let rst = findNodesByUserIdFrom(userId, curNode.children[i]);
                if(rst.length != 0) rstArray = rstArray.concat(rst);
            }
            return rstArray;
        }

        function highlightLeavesFrom(node){
            if(node.children.length === 0){
                node.highlight = 1;
                return;
            }else{
                node.highlight = -1;
            }
            for(var i = 0; i < node.children.length; i++){
                highlightLeavesFrom(node.children[i]);
            }
        }
        function cancelHighlightFrom(node){
            node.highlight = 0;
            for(var i = 0; i < node.children.length; i++){
                cancelHighlightFrom(node.children[i]);
            }
        }
        
        /************ Public Functions ************/
        graph.selectCurShowNode = function(node){
            CurShowNode = svg.select("#C" + node.nodeId);
            if(CurShowNode && CurShowNode != Root){
                CurShowNode.transition()
                    .ease(d3.easeBounce)
                    .duration(400)
                    .attr("r", 15);
            }
            // else{
            //     CurShowNode = svg.selectAll("circle").attr("id", node.nodeId);
            //     console.log(CurShowNode);
            //     CurShowNode.transition()
            //             .ease(d3.easeBounce)
            //             .duration(400)
            //             .attr("r", 15);
            // }
        }
        graph.checkout = function(beginNode, info){    //Both single and multiple node(s) supported
            var node = new Node(info.userId, beginNode, info.action, info.duration, info.datetime, info.reason, info.nodename, info.type, info.source, info.target, info.linkname, info.datalink, info.value);
            beginNode.children.push(node);
            return node;
        }

        graph.merge = function(mergeNodes, mergeReason){
            var node = new Node(0, mergeNodes, "Merge", 0, (new Date()).toString(), mergeReason, "Merge", "Merge", null, null, null, null, null);
            for(var i = 0; i < mergeNodes.length; i++){
                mergeNodes[i].children.push(node);
                if(mergeNodes[i].duration > node.duration){
                    node.duration = mergeNodes[i].duration;
                }
            }
            return node;
        }

        graph.findNodeById = function(nodeId){
            return findNodeByIdFrom(nodeId, Root);
        }

        graph.findLatestNodeByUserId = function(userId){
            var curNode = Root;
            let rstArray = findNodesByUserIdFrom(userId, curNode);
            let max = 0;
            let record = null;
            for(var i = 0; i < rstArray.length; i++){
                if(max < rstArray[i].nodeId){
                    record = rstArray[i];
                    max = rstArray[i].nodeId;
                }
            }
            return record;
        }

        graph.findByUserIdAmong = function(userId, nodes){
            var rst = nodes.filter(function(d){
                return d.userId === userId;
            })
            if(rst.length > 1){
                console.log("Multiple branches own this same userId, which is not supported");
            }
            return rst[0];
        }

        graph.refresh = function(){
            function drawFrom(node){
                for(var i = 0; i < node.children.length; i++){
                    drawLink(node, node.children[i]);
                    drawFrom(node.children[i]);
                }
                drawCircle(node);
            }

            function refillPositionFrom(node){
                if(node.fathers === null){
                    node.position.x = width / 2;
                    node.position.y = 20;
                }else{
                    let posY = 0;
                    let posX = 0;
                    if(node.fathers.length > 1){
                        for(var i = 0; i < node.fathers.length; i++){
                            if(node.fathers[i].position.y > posY) posY = node.fathers[i].position.y;
                            posX += node.fathers[i].position.x;
                        }
                        posX = posX / node.fathers.length;
                        node.position.x = posX;
                        node.position.y = posY + fullVerticalStep;
                    }else{ //if(node.fathers.length === 1)
                        let fatherWidth = node.fathers[0].weight * width;
                        let fatherStartX = node.fathers[0].position.x - fatherWidth / 2;
                        let previousLength = 0;
                        let idx = node.fathers[0].children.indexOf(node);
                        for(var i = 0; i < idx; i++){
                            previousLength += node.fathers[0].children[i].weight;
                        }
                        previousLength = previousLength * width;
                        let posX = fatherStartX + previousLength + node.weight * width / 2;
                        let posY = node.fathers[0].position.y + fullVerticalStep * node.duration * durationStepConst;
                        node.position.x = posX;
                        node.position.y = posY;
                    }
                }
                for(var i = 0; i < node.children.length; i++){
                    refillPositionFrom(node.children[i]);
                }
            }

            function drawCircle(node){    //One color represents one ID
                if(node.highlight === -1){
                    colorId = 0;
                    opacity = 0.1;
                }else if(node.highlight === 1){
                    colorId = node.userId;
                    opacity = 0.6;
                }else{
                    opacity = 0.4;
                    colorId = node.userId;
                }
                var circle = svg.append("circle")
                        .attr("id", "C" + node.nodeId)
                        .attr("r", 10)
                        .attr("stroke", colorAlloc(colorId))
                        .attr("stroke-width", 2)
                        .attr("fill", colorAlloc(colorId))
                        .attr("fill-opacity", opacity)
                        .attr("stroke-opacity", opacity)
                        .attr("style","cursor: hand")
                        .attr("transform", "translate(" + node.position.x + "," + node.position.y + ")");
                circle.on("click", ()=>{
                    if(CurShowNode !== null && CurShowNode != Root){
                        CurShowNode.transition()
                            .ease(d3.easeBounce)
                            .duration(400)
                            .attr("r", 10);
                    }
                    circle.transition()
                            .ease(d3.easeBounce)
                            .duration(400)
                            .attr("r", 15);
                    CurShowNode = circle;
                    showStateById(parseInt(CurShowNode.attr("id").replace(/C/g, '')));
                })
            }
            function showStateById(id){
                let node = graph.findNodeById(id);
                let backStack = graph.backRoute(node);
                if(backStack.mergeNode !== null){
                    //merge action
                }else{
                    backStack = backStack.nodeStack;
                }
                graph.onIGraphBuild(backStack.reverse(), node);
            }
            function drawLink(beginNode, endNode){
                var curveFunction = d3.line()
                        .x((d) => { return d.x; })
                        .y((d) => { return d.y; })
                        .curve(d3.curveCatmullRom.alpha(0.5));

                var lineData=[  {"x": beginNode.position.x,   "y": beginNode.position.y},  
                                {"x": endNode.position.x,     "y": endNode.position.y}   ];
                svg.append("path")
                    .attr("d", curveFunction(lineData))
                    .attr("stroke","black")
                    .attr("stroke-opacity", 0.4)
                    .attr("stroke-width",2)
                    .attr("fill","none");
            }
            svg.selectAll("circle").remove();
            svg.selectAll("path").remove();

            if(RecalPos){
                refillWeightFrom(Root);
                refillPositionFrom(Root);
                RecalPos = true;    //TODO Later revise
            }
            drawFrom(Root);
        }

        graph.insert = function(pullStamp, info){
            // datetime
            // username
            // nodesInfo
            let temp = null;
            if(pullStamp === -1) temp = CurShowNode;
            else temp = graph.findNodeById(Repository[pullStamp].nodeId);    
            // A temporary method
            // In order to obtain the handler of a node,
            // however, repo things are deep copy. Now, only
            // use id to find hanlder, which is possibly not
            // able to support some complex structure

            for(var i = 0; i < info.nodesInfo.length; i++){
                temp = graph.checkout(temp, {
                    userId: info.userId,
                    datetime: info.datetime,
                    action: info.nodesInfo[i].action,
                    duration: info.nodesInfo[i].duration,
                    nodename: info.nodesInfo[i].nodename,
                    reason: info.nodesInfo[i].reason,
                    type: info.nodesInfo[i].reason,
                    data: info.nodesInfo[i].data
                });
            }
            graph.refresh();
            graph.selectCurShowNode(temp);
        }
        graph.onClickPull = function(){
            if(isMerging)return;
            if(isPulling){
                isPulling = false;
                cancelHighlightFrom(Root);
            }else{
                isPulling = true;
                highlightLeavesFrom(Root);
            }
            graph.refresh();
            return stampId;
        }

        graph.onClickMerge = function(){
            if(isPulling)return;
            if(isMerging){
                isMerging = false;
                cancelHighlightFrom(Root);
            }else{
                isMerging = true;
                highlightLeavesFrom(Root);
            }
            graph.refresh();
        }

        graph.backRoute = function(node){
            let curNode = node;
            let backStack = [];
            if(curNode === null){
                console.log(id, "Not found");
                return;
            }
            while(curNode.fathers && curNode.fathers.length === 1){
                backStack.push(curNode);
                curNode = curNode.fathers[0];
            }
            if(curNode.fathers && curNode.fathers.length > 1){
                return {mergeNode: curNode, backNodes: backStack};
            }else{
                return {mergeNode: null, nodeStack: backStack};
            }
        }

        graph.getCurShowNode = function(){
            if(CurShowNode === Root) return Root;
            return graph.findNodeById(parseInt(CurShowNode.attr("id").replace(/C/g, '')));
        }

        graph.getNextNodeId = function(){
            return nodeCounter;
        }


        /************ Example ************/
        // var InfoA = {
        //     // username: "Alan",
        //     userId: 1,
        //     duration: 100,  //second
        //     action: "Add Node 1",
        // }
        // var InfoB = {
        //     // username: "Alan",
        //     userId: 2,
        //     duration: 200,  //second
        //     action: "Add Node 2",
        // }
        // var InfoC = {
        //     // username: "Alan",
        //     userId: 3,
        //     duration: 200,  //second
        //     action: "Add Node 3",
        // }
        // var InfoC2 = {
        //     // username: "Alan",
        //     userId: 3,
        //     duration: 300,  //second
        //     action: "Add Node 4",
        // }
        // var InfoB2 = {
        //     // username: "Alan",
        //     userId: 2,
        //     duration: 200,  //second
        //     action: "Add Node 6",
        // }
        // var InfoA2 = {
        //     // username: "Alan",
        //     userId: 1,
        //     duration: 100,  //second
        //     action: "Add Node 7",
        // }
        // let A = Root.checkout(InfoB).checkout(InfoB2);
        // let B = Root.checkout(InfoA);
        // let C = graph.merge([A, B], "reason");
        // C.checkout(InfoC).checkout(InfoC2);
        // graph.findNodeById(1).checkout([InfoB2]);
        // graph.findLatestNodeByUserId(1).checkout([InfoA2]);
        // graph.merge([graph.merge([graph.findLatestNodeByUserId(1), graph.findLatestNodeByUserId(2)]),graph.findLatestNodeByUserId(3)])

        // RecalPos = true;
        // graph.refresh();

        return graph;
    }

})


// TODO: graph.pull -- should pass out a state as symbol
// TODO: log.append not here but share part