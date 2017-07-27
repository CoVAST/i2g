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

        /************ Tree Structure ************/
        var Node = function(userId, position, fathers, action, duration){
            //Calculate weight
            var weight = 0.0;
            if(!fathers) weight = 1;
            else if(fathers.length === 1){
                weight = fathers[0].weight / fathers[0].children.length;
            }else{
                for(var i = 0; i < fathers.length; i++){
                    weight += fathers[i].weight;
                }
            }
            //Formatted fathers
            fathers = Array.isArray? fathers : [fathers];
            return {
                userId: userId,
                nodeId: nodeCounter++,
                position: {
                    x: position.x,
                    y: position.y
                },
                weight: weight,
                children: [],
                fathers: fathers,
                action: action,
                duration: duration
            }
        }
        /************ Global Parameters ************/
        var Root = new Node(0, {x: null, y: null}, null, "Root");    // Mark 0 as root/merge/...(which is structural-part) node
        var RecalPos = true;
        var fullVerticalStep = 40;
        var graph = svg;

        /************ Private Functions ************/

        function refillWeightFrom(node){
            if(!node.fathers) node.weight = 1;
            else if(node.fathers.length === 1){
                node.weight = node.fathers[0].weight / node.fathers[0].children.length;
            }else{
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

        /************ Public Functions ************/
        graph.checkout = function(beginNode, info){    //Both single and multiple node(s) supported
            info = Array.isArray(info)? info : [info];
            for(var i = 0; i < info.length; i++){
                var node = new Node(info.userId, {x: null, y: null}, [beginNode], info.action, info.duration);
                beginNode.children.push(node);
            }
        }

        graph.merge = function(mergeNodes){
            var node = new Node(0, {x: null, y: null}, mergeNodes, "merge", 0);
            for(var i = 0; i > info.length; i++){
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
                            posX = node.fathers[i].position.x;
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
                        let posY = node.fathers[0].position.y + fullVerticalStep;
                        node.position.x = posX;
                        node.position.y = posY;
                    }
                }
                for(var i = 0; i < node.children.length; i++){
                    refillPositionFrom(node.children[i]);
                }
            }

            function drawCircle(node){    //One color represents one ID
                svg.append("circle")
                    .attr("id", node.nodeId)
                    .attr("r", 10)
                    .attr("stroke", colorAlloc(node.userId))
                    .attr("stroke-width", 2)
                    .attr("fill", colorAlloc(node.userId))
                    .attr("fill-opacity", "0.4")
                    .attr("stroke-opacity", "0.4")
                    .attr("transform", "translate(" + node.position.x + "," + node.position.y + ")");
            }
            function drawLink(beginNode, endNode){
                var curveFunction = d3.line()
                        .x((d) => { return d.x; })
                        .y((d) => { return d.y; })
                        .curve(d3.curveCatmullRom.alpha(0.5));

                var lineData=[  {"x":beginNode.position.x,   "y":beginNode.position.y},  
                                {"x":endNode.position.x,  "y":endNode.position.y}   ];
                svg.append("path")
                    .attr("d", curveFunction(lineData))
                    .attr("stroke","black")
                    .attr("stroke-opacity", 0.4)
                    .attr("stroke-width",2)
                    .attr("fill","none");
            }

            if(RecalPos){
                refillWeightFrom(Root);
                refillPositionFrom(Root);
                RecalPos = false;
            }
            drawFrom(Root);
        }
        /************ Entrance ************/
        graph.refresh() ;

        /************ Example ************/
        var InfoA = {
            // username: "Alan",
            userId: 1,
            duration: 100,  //second
            action: "Add Node 1",
        }
        graph.checkout(Root, [InfoA, InfoA, InfoA]);
        graph.checkout(graph.findNodeById(3), [InfoA]);
        RecalPos = true;
        graph.refresh();

        return graph;
    }

})