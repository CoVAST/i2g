define(function(require) {
    var logos = require('./icons'),
        pipeline = require('p4/core/pipeline'),
        histrec = require('./history');
    var histIdx = 0,
        curTimestamp = 0;
    return function(arg) {
        'use strict';
        var options = arg || {},
            container = options.container || "body",
            domain = options.domain || [0, 1],
            graph = options.graph || {},
            width = options.width,
            height = options.height,
            menu = options.menu || false,
            notePanel = options.notePanel || null,
            onselect = options.onselect || function() {},
            historyList = options.historyList,
            graphId = options.graphId || 'igraph-svg',
            graphName = options.graphName || '',
            scale = options.scale || 1,
            colorScheme = options.colorScheme;

        var otGraph = {},
            nodes = graph.nodes,
            links = graph.links;

        var trackHistory = true,
            historyIcons = {
                location: 'marker',
                people: 'user',
                datetime: 'wait',
                time: 'wait'
            };

        let logFunc = (str) => () => console.log(str);

        let histRec = new histrec();

        function addHistory(hist) {
            console.log("Index: " + histIdx);
            if(trackHistory && typeof historyList != 'undefined') {
                var histIcon = (hist.data.hasOwnProperty('type')) ? historyIcons[hist.data.type] : 'linkify';
                console.log(hist.data);
                historyList.append({
                    header: hist.action + ' ' + (hist.data.label || hist.data.id),
                    icon: histIcon,
                    text: hist.data.detail || ''
                })
            }
            var timestamp = histIdx;   //HistIdx begins from 0, corresponding to List ids.
            curTimestamp = histIdx;
            histIdx++;
            //Here, to show the latest history first
            //if(curTimestamp != maxTimestamp) otGraph.showRecHist(maxTimestamp);
            histRec.addRecord(timestamp, hist);
        };

        function silentAddLink(li){
            if(typeof(li.id) === "undefined") li.id = links.length;
            if(typeof li.source !== 'object') {
                var sourceId = (graphName===null) ? li.source : graphName + li.source;
                li.source = nodeHash[sourceId];
            }
            if(typeof li.target !== 'object') {
                var targetId = (graphName===null) ? li.target : graphName + li.target;
                li.target = nodeHash[targetId];
            }

            if(!li.hasOwnProperty('datalink')) li.datalink = false;
            links[li.id] = li;
            otGraph.update();
        }
        function silentAddNode(newNode, id){
            var pos = newNode.pos || [width/2, height/2];
            if(!newNode.hasOwnProperty('id'))
                newNode.id = nodeCounter++;
            if(!newNode.hasOwnProperty('datalink'))
                newNode.datalink = false;
            newNode.tag = newNode.label;
            newNode.x = pos[0];
            newNode.y = pos[1];
            if(graphName!==null)
                newNode.id = graphName + newNode.id;
            nodeHash[newNode.id] = newNode;

            addNodeIcon(newNode);
            addNodeLabel(newNode);
            otGraph.update();
        }
        function silentRemoveLink(linkId){
            //var removedLink = links.splice(linkId, 1)[0];
            var removedLink = links[linkId];
            if(removeLink.hasOwnProperty('icon'))
                removedLink.icon.remove();
            otGraph.update();
            links[linkId] = null;
        }
        function silentRemoveNode(nodeId){
            nodeIcons[nodeId]._icon.remove();
            nodeIcons[nodeId].remove();
            nodeLabels[nodeId].remove();
            delete nodeIcons[nodeId];
            delete nodeLabels[nodeId];
            delete nodeHash[nodeId];
            nodes = nodes.filter(function(d){
                return d.id != nodeId;
            })
            otGraph.update();
        }

        otGraph.traceCurTime = function(){
            console.log("Trace to timestamp: " + curTimestamp);
            histRec.reviseRecToCurrent(curTimestamp);
            histIdx = curTimestamp + 1;
            let cnt = 0;
            while(historyList.children.length - 1 > curTimestamp) {
                cnt++;
                historyList.remove(historyList.children.length - 1);  //Something like this
            }
        }
        
        otGraph.fetchVisData = function(idx){
            // console.log(histRec.fetchSpecificRecord(idx));
            if(histRec.fetchSpecificRecord(idx) === null) return null;
            return histRec.fetchSpecificRecord(idx).visData;
        }

        otGraph.showRecHist = function(idx){ //To show recorded history
            if(historyList.children.length == 0)return;
            if(idx === -1){
                idx = historyList.children.length - 1;
            }
            var histFetch = histRec.fetchRecord(idx, curTimestamp);
            var histline = histFetch.histline;
            if(histFetch.choice === "undo"){
                for(var i = histline.length - 1; i >= 0; i--){
                    if(histline[i].revAction === "Add link"){
                        silentAddLink({
                            id: histline[i].hist.data.id,
                            source: histline[i].hist.data.source,
                            target: histline[i].hist.data.target,
                            value: histline[i].hist.data.value,
                            datalink: histline[i].hist.data.datalink
                        });
                        otGraph.update();
                    }else if(histline[i].revAction === "Add node"){
                        silentAddNode({
                            id: histline[i].hist.data.id,
                            label: histline[i].hist.data.tag,
                            type: histline[i].hist.data.type,
                            fx: histline[i].hist.data.x,
                            fy: histline[i].hist.data.y,
                            value: histline[i].hist.data.value,
                            datalink: histline[i].hist.data.datalink
                        });
                        otGraph.update();
                    }else if(histline[i].revAction === "Remove link"){
                        //let l = links[links.length - 1];
                        silentRemoveLink(histline[i].hist.data.id);
                        otGraph.update();
                    }else if(histline[i].revAction === "Remove node"){
                        //let n = nodes[nodes.length - 1];
                        silentRemoveNode(histline[i].hist.data.id);
                        otGraph.update();
                    }else{
                        logFunc("Histline.action not defined");
                    }
                }
            }else if(histFetch.choice === "redo"){
                for(var i = 0; i < histline.length; i++){
                    if(histline[i].hist.action === "Add link"){
                        silentAddLink({
                            id: histline[i].hist.data.id,
                            source: histline[i].hist.data.source,
                            target: histline[i].hist.data.target,
                            value: histline[i].hist.data.value,
                            datalink: histline[i].hist.data.datalink
                        });
                        otGraph.update();
                    }else if(histline[i].hist.action === "Add node"){
                        silentAddNode({
                            id: histline[i].hist.data.id,
                            label: histline[i].hist.data.tag,
                            type: histline[i].hist.data.type,
                            fx: histline[i].hist.data.x,
                            fy: histline[i].hist.data.y,
                            value: histline[i].hist.data.value,
                            datalink: histline[i].hist.data.datalink
                        });
                        otGraph.update();
                    }else if(histline[i].hist.action === "Remove link"){
                        silentRemoveLink(histline[i].hist.data.id);
                        otGraph.update();
                    }else if(histline[i].hist.action === "Remove node"){
                        silentRemoveNode(histline[i].hist.data.id);
                        otGraph.update();
                    }else{
                        logFunc("Histline.action not defined");
                    }
                }
            }
            curTimestamp = idx;
            otGraph.update();
        }

        var maxLinkValue = 0,
            nodeCounter = 0;

        var svg = d3.select(container).append('svg:svg');
        svg.attr('id', graphId).attr("width", width).attr("height", height);

        svg.append("svg:defs").append("svg:marker")
              .attr("id",'end')
              .attr("viewBox", "0 -5 10 10")
               .attr("markerUnits", "userSpaceOnUse")
              .attr("refX", 0)
              .attr("refY", 0)
              .attr("markerWidth", 15)
              .attr("markerHeight", 15)
              .attr("orient", "auto")
            .append("svg:path")
            //   .attr("stroke", "red")
            //   .attr("stroke", "none")
              .attr("fill", "purple")
            //   .attr("transform", "scale(0.05)")
            //   .attr("d", logos('info'));
              .attr("d", "M0,-5L10,0L0,5");

        var linkColor = d3.scaleOrdinal(d3.schemeCategory20);

        var nodeTypeColor = {
            location: colorScheme.area,
            people: colorScheme.people,
            time: colorScheme.time,
            date: colorScheme.time,
            day: colorScheme.time,
            datetime: colorScheme.time
        }
        var nodeColor = function(d) {
            // if(d.type == 'location') {
            //     return linkColor(d.id);
            // }
            if(nodeTypeColor.hasOwnProperty(d.type))
                return nodeTypeColor[d.type];
            else
                return 'black';
        }

        var nodeSize = d3.scalePow()
            .exponent(0.20)
            .domain([1, 3000])
            .range([5, 500]);

        var linkSize = d3.scalePow()
            .exponent(0.2)
            .domain([0, 3000])
            .range([1*scale, 6*scale]);

        var simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("link", d3.forceLink(links).distance(200).strength(1).iterations(20))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked)
            // .force("x", d3.forceX())
            // .force("y", d3.forceY())
            // .alphaTarget(0.3)
            .stop()
            ;

        var g = svg.append("g"),
            link = g.append("g").attr("stroke", "#BBB").selectAll(".link"),
            node = g.append("g").attr("stroke-width", 2).attr("stroke", "none").selectAll(".node");

        var linkIcons = [],
            linkLabels = [];

        var icons = g.append("g"),
            nodeIcons = {};

        var nodeInfo = g.append("g"),
            nodeLabels = {};

        var nodeHash = {};

        restart();

        var linkSource = null,
            linkTarget = null,
            newArrivingNode = null;

        var tempLink = svg.append('g')
            .append('line')
            .attr('stroke', '#CCC')
            .attr('stroke-width', 0)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', 0);

        svg.on('mousemove', function(e){
            if(linkSource !== null){
                var pos = d3.mouse(this);
                tempLink.attr('x2', pos[0]-3)
                    .attr('y2', pos[1]-3);
            }
        })

        function restart() {

            // Apply the general update pattern to the nodes.
            //
            nodes = Object.keys(nodeHash).map(function(k){
                return nodeHash[k];
            });

            node = node.data(nodes, function(d) {
                return d.id;
            });

            node.exit().remove();
            node = node.enter()
                .append("circle")
                .attr('class', 'nodeHolder')
                // .attr("fill", function(d) {
                //     return nodeColor(d.type);
                // })
                .attr("fill", "transparent")
                .attr("r", 40)
                .merge(node)
                .on('click', function(d){
                    // d.fx = d3.mouse(this)[0];
                    // d.fy = d3.mouse(this)[1];
                // console.log('clicked on node', d.id);
                if(linkSource !== null && linkTarget === null) {
                        linkTarget = d;
                        console.log(linkTarget);
                        otGraph.addLinks({
                            source: linkSource,
                            target: linkTarget,
                            value: 2,
                            datalink: false
                        })

                        linkSource = linkTarget = null;
                        tempLink
                            .attr('stroke-width', 0)
                            .attr('x1', 0)
                            .attr('y1', 0)
                            .attr('x2', 0)
                            .attr('y2', 0);

                        restart();
                    }
                })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended))

            node
            .append('title')
            .text((d)=>{ if(d.detail) return d.detail})
            // console.log(node);
            node.data(nodes, function(d){
                addNodeIcon(d);
                addNodeLabel(d);
            });

            // Apply the general update pattern to the links.
            //
            var denseLinks = links.filter(function(li){
                return li && nodeHash.hasOwnProperty(li.source.id) &&  nodeHash.hasOwnProperty(li.target.id);
            });

            link = link.data(denseLinks, function(d) {
                return d.source.id + "-" + d.target.id;
            });
            link.exit().remove();

            maxLinkValue = d3.max(denseLinks.map((d)=>d.value));
            linkSize.domain([0, maxLinkValue]);
            link = link.enter()
                .append("path")
                .attr('class', 'graphLinks')
                .attr("stroke-width", (d)=>linkSize(d.value))
                // .attr("stroke", (d)=>linkColor(d.dest))
                .attr("marker-mid", "url(#end)")
                .merge(link);

            link.append('title')
                .text((d)=>(d.value))

            // link.data(links, function(li){
            //     if(!li.hasOwnProperty('icon'))
            //         addLinkIcon(li);
            // })
            // Update and restart the simulation.
            simulation.nodes(nodes);
            simulation.force("link").links(denseLinks).iterations(10);
            simulation.alphaTarget(0.3).restart();
        }

        function ticked() {
            node.attr("cx", function(d) {return d.x;})
                .attr("cy", function(d) {return d.y;})

            // link.attr("x1", function(d) {return d.source.x;})
            //     .attr("y1", function(d) {return d.source.y;})
            //     .attr("x2", function(d) {return d.target.x;})
            //     .attr("y2", function(d) {return d.target.y;});

            link.attr("d", function(d){
                return "M" + d.source.x + "," + d.source.y
                + " L" + ((d.target.x + d.source.x)/2) + "," +((d.target.y + d.source.y)/2)
                + "," + d.target.x + "," + d.target.y;
            })

            var paddingSpace = 50;
            node.data(nodes, function(d, i){
                updateNodeLabel(d);
                updateNodeIcon(d);

                if(d.x > width - paddingSpace) {
                    d.fx = width - paddingSpace;
                } else if(d.x < paddingSpace) {
                    d.fx = paddingSpace
                }

                if(d.y > height - paddingSpace) {
                    d.fy = height -paddingSpace;
                } else if(d.y < paddingSpace) {
                    d.fy = paddingSpace;
                }
            });

            // link.data(links, function(li, i){
            //     li.icon.attr("transform", "translate(" +
            //         (li.source.x + (li.target.x-li.source.x)/2 - 8) + "," +
            //         (li.source.y + (li.target.y-li.source.y)/2 - 8) + ")")
            // })
        }

        function dragstarted(d) {
            // if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
            nodeLabels[d.id].attr("x", d.fx);
            nodeLabels[d.id].attr("y", d.fy);
            histRec.updateHistory(d.id, d.fx, d.fy);  //Strange Responding Stop
            nodeHash[d.id].x = d.fx;
            nodeHash[d.id].y = d.fy;
        }

        function dragended(d) {
            // if (!d3.event.active) simulation.alphaTarget(0);
            //   this.style.fill = selectionColor(d.id);

            
            onselect.call(this, d);

            //   d.fx = null;
            //   d.fy = null;
        }

        function addNodeLabel(d) {
            if (!nodeLabels.hasOwnProperty(d.id)) {

                nodeLabels[d.id] = nodeInfo.append("text")
                    .attr("class", "nodeLabels")
                    .attr("dx", 20)
                    // .attr("dy", ".35em")
                    .attr("x", d.x)
                    .attr("y", d.y);
                labelNode(d);
            }
        }

        function labelNode(d) {
            var label = (d.hasOwnProperty('label')) ? d.label : d.id;
            if(label.length > 20)
                label = label.slice(0, 7) + '...';
            if(d.hasOwnProperty('labelPrefix'))
                label = d.labelPrefix + label;
            nodeLabels[d.id].text(label);
        }

        function updateNodeLabel(d) {
            if (nodeLabels.hasOwnProperty(d.id)) {
                nodeLabels[d.id].attr("x", d.x);
                nodeLabels[d.id].attr("y", d.y);
            }
        }

        function addNodeIcon(d) {
            if(!nodeIcons.hasOwnProperty(d.id) || nodeIcons[d.id] === null){
                nodeIcons[d.id] = icons.append("g")
                    .attr("pointer-events", "none");

                nodeIcons[d.id]._icon = nodeIcons[d.id].append("path")
                    .attr("transform", "scale(" + scale * 0.1 + ")")
                    .attr("d", logos(d.icon || d.type))
                    .attr("fill", nodeColor(d))
            }
        }

        function addLinkIcon(d) {

            links[d.id].icon = icons.append("g")
                .attr("pointer-events", "none");
            links[d.id].icon.attr("transform", "translate(" +
                (d.source.x + (d.target.x-d.source.x)/2 - 8) + "," +
                (d.source.y + (d.target.y-d.source.y)/2 - 8) + ")")

            links[d.id].icon.append("path")
                .attr("transform", "scale(0.05)")
                .attr("d", logos('info'))
                .attr("fill", 'red');
        }


        function updateNodeIcon(d) {
            nodeIcons[d.id]
            .attr("transform", "translate(" + (d.x-20) + "," + (d.y-20) + ")")
        }

        function nodeMenu() {
            $.contextMenu({
                selector: '.nodeHolder',
                callback: function(key, options) {
                    var thisNode = this[0],
                        thisNodeId = thisNode.__data__.id;
                    if(key == 'removeNode') {
                        otGraph.showRecHist(-1);
                        historyList.clearSelected();
                        historyList.setSelectedItemIds([historyList.children.length - 1]);
                        removeNode(thisNodeId, "alarm");
                        restart();
                    } else if(key == 'annotate') {
                        d3.select(thisNode).attr('stroke', 'orange');
                        console.log(nodeHash[thisNodeId]);
                        notePanel.setNote({
                            label: nodeHash[thisNodeId].labelPrefix+nodeHash[thisNodeId].label,
                            detail: nodeHash[thisNodeId].detail
                        })
                        notePanel.show();
                        notePanel.onsave = function() {
                            var info = notePanel.getNote();
                            info.labelPrefix = '';
                            otGraph.modifyNode(thisNodeId, info);
                            d3.select(thisNode).attr('stroke', 'transparent');
                        }
                        notePanel.oncancel = function() {
                            d3.select(thisNode).attr('stroke', 'transparent');
                        }
                    } else if(key == 'addLink'){
                        otGraph.showRecHist(-1);
                        historyList.clearSelected();
                        historyList.setSelectedItemIds([historyList.children.length - 1]);
                        if(!nodeHash[thisNodeId]){
                            alert("Relevant node has been deleted.");
                            return;
                        }
                        linkSource = nodeHash[thisNodeId];
                        linkTarget = null;
                        tempLink
                            .attr('x1', linkSource.x)
                            .attr('y1', linkSource.y)
                            .attr('x2', linkSource.x)
                            .attr('y2', linkSource.y)
                            .attr('stroke-width', 4);
                    }
                },
                items: {
                    removeNode: {name: "Remove this node", icon: "fa-times"},
                    addLink: {name: "Add link", icon: "fa-long-arrow-right"},
                    annotate: {name: "Annotate", icon: "fa-commenting"},
                }
            });
        }

        function linkMenu() {
            $.contextMenu({
                selector: '.graphLinks',
                callback: function(key, options) {
                    var thisLink = this[0],
                        thisLinkId = thisLink.__data__.id;
                    if(key == 'removeLink') {
                        otGraph.showRecHist(-1);
                        historyList.clearSelected();
                        historyList.setSelectedItemIds([historyList.children.length - 1]);
                        removeLink(thisLinkId, "alarm");
                        d3.select(thisLink).remove();
                    } else if(key == 'annotate') {

                    }
                },
                items: {
                    removeLink: {name: "Remove this link", icon: "fa-times"},
                    annotate: {name: "Annotate", icon: "fa-commenting"},
                }
            });
        }
        nodeMenu();
        linkMenu();

        otGraph.addNodes = function(newNodes) {
            var newNodes = (Array.isArray(newNodes)) ? newNodes : [newNodes];
            newNodes.forEach(function(newNode){
                silentAddNode(newNode);
                addHistory({
                    action: 'Add node',
                    data: newNode
                });
            })
            historyList.clearSelected();
            historyList.setSelectedItemIds([historyList.children.length - 1]);
            return otGraph;
        }

        otGraph.addLinks = function(newLinks){
            var newLinks = (Array.isArray(newLinks)) ? newLinks : [newLinks];
            newLinks.forEach(function(li){
                if(li){
                    silentAddLink(li);
                    addHistory({
                        action: 'Add link',
                        data: li
                    });
                    historyList.clearSelected();
                    historyList.setSelectedItemIds([historyList.children.length - 1]);
                }
            })
            return otGraph;
        };


        otGraph.modifyNode = function(d, props) {
            var theNode = (typeof d == 'object') ? d : nodeHash[d];

            for(var p in props) {
                theNode[p] = props[p];
            }

            if(props.hasOwnProperty('label')) {
                labelNode(theNode);
            }
        }

        function removeNode(nodeId, choice) {
            cascadingRemoveNode(nodeId, choice);
            historyList.clearSelected();
            historyList.setSelectedItemIds([historyList.children.length - 1]);
        }

        function cascadingRemoveNode(nodeId, choice){
            if(!nodeHash[nodeId] && choice === "alarm"){
                alert("Relevant Node has been deleted.");
                return;
            }
            for(var i = links.length - 1; i >= 0; i--){  //Cascading deletion for relevant edges
                if(links[i] && (links[i].source.id === nodeId || links[i].target.id === nodeId)){
                    removeLink(i);
                }
            }

            addHistory({
                action: 'Remove node',
                data: nodeHash[nodeId]
            });
            nodeIcons[nodeId]._icon.remove();
            nodeIcons[nodeId].remove();
            nodeLabels[nodeId].remove();
            delete nodeIcons[nodeId];
            delete nodeLabels[nodeId];
            delete nodeHash[nodeId];
            nodes = nodes.filter(function(d){
                return d.id != nodeId;
            })
            otGraph.update();
        }

        function removeLink(linkId, choice) {
            if(!links[linkId] && choice === "alarm"){
                alert("Relevant Link has been deleted.");
                return;
            }
            addHistory({
                action: 'Remove link',
                data: links[linkId]
            });
            silentRemoveLink(linkId);
            historyList.clearSelected();
            historyList.setSelectedItemIds([historyList.children.length - 1]);
        }

        otGraph.removeNodes = function(query) {
            var nodeIds,
                query = query ||  {};

            if(query.all) {
                nodes.forEach(function(n) {
                    removeNode(n.id);
                })
            } else {
                if(query.id) {
                    nodeIds = query.id;
                } else if(query.type) {
                    nodeIds = nodes.filter(function(n){
                        return n.type !== query.type;
                    })
                    .map(function(n){ return n.id });
                } else if(query.datalink) {
                    nodeIds = nodes.filter(function(n){
                        return n.datalink !== query.datalink;
                    })
                    .map(function(n){ return n.id });
                }

                nodeIds.forEach(function(nid){
                    removeNode(nid);
                });
            }
            historyList.clearSelected();
            historyList.setSelectedItemIds([historyList.children.length - 1]);
            return otGraph;
        }

        otGraph.removeLinks = function(query) {
            var linkIds,
                query = query ||  {};

            if(query.all) {
                links = [];
            } else {
                if(query.id) {
                    linkIds = query.id;
                } else if(query.type) {
                    linkIds = links.filter(function(li){
                        return li && li.type !== query.type;
                    })
                    .map(function(n){ return li.id });
                } else if(query.datalink) {
                    linkIds = links.filter(function(li){
                        return li && li.datalink !== query.datalink;
                    })
                    .map(function(li){ return li.id });
                }
                linkIds.forEach(function(lid){
                    removeLink(lid);
                });
            }

            return otGraph;
        }

        otGraph.update = function(subgraph) {
            var subgraph = subgraph || {nodes: null, links: null},
                newNodes = subgraph.nodes || [],
                newLinks = subgraph.links || [];

            if(newNodes.length) otGraph.addNodes(newNodes);
            if(newLinks.length) otGraph.addLinks(newLinks);

            restart();
            return otGraph;
        };

        otGraph.append = function(subgraph) {
            otGraph.addNodes(subgraph.nodes);
            otGraph.addLinks(subgraph.links);
            restart();
            return otGraph;
        }

        otGraph.remake = function(graph) {
            // nodes = graph.nodes;
            // nodeHash = {};

            graph.nodes.forEach(function(n){
                n.fx = null;
                n.fy = null;
            })
            otGraph.addNodes(graph.nodes);
            restart();

            var newLinks = graph.links.map(function(sl){
                return {
                    source: nodeHash[sl.source.id],
                    target: nodeHash[sl.target.id],
                    value: sl.value,
                };
            });
            otGraph.addLinks(newLinks);

            restart();
            return otGraph;
        }

        otGraph.getNodes = function(query) {
            console.log('ALL NODES :', nodes);
            if(typeof query === 'undefined')
                return nodes;
            else {
                return pipeline()
                    .match(query)
                    (nodes);
            }
        };

        otGraph.findNode = function(query) {
            return otGraph.getNodes(query)[0];
        }

        otGraph.getLinks = function() { return links;};

        return otGraph;
    }
})
