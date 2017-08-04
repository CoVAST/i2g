define(function(require) {
    var logos = require('./icons'),
        pipeline = require('p4/core/pipeline');
    return function(arg) {
        'use strict';
        /**************Initialization Variables***************/
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

        var history = [],
            trackHistory = true,
                historyIcons = {
                location: 'marker',
                people: 'user',
                datetime: 'wait',
                time: 'wait'
            };

        var localState = historyList.Root;
        var pullStamp = 0;

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

        var visData = {};  
        /**************Local functions***************/

        function addHistory(hist) {
            if(trackHistory && typeof historyList != 'undefined') {
                let histIcon = (hist.data.hasOwnProperty('type')) ? historyIcons[hist.data.type] : 'linkify';
                let info = null;
                if(hist.action.indexOf("node") !== -1){
                    info = {
                        userId: 0,
                        datetime: hist.data.datetime || "2017-XX-XX",
                        action: hist.action,
                        duration: hist.data.duration || 200,
                        nodename: hist.data.label,
                        reason: hist.data.reason,
                        type: hist.data.type,
                        data: hist.data.visData || null
                    };
                    visData[historyList.getNextNodeId()] = hist.data.visData;
                }else{
                    info = {    
                        userId: hist.data.userId,
                        source: hist.data.source,
                        target: hist.data.target,
                        reason: hist.data.reason || "Relevant",
                        linkname: hist.data.linkname,
                        duration: hist.data.duration || 200,
                        datetime: hist.data.datetime || "2017-XX-XX",
                        datalink: hist.data.datalink,
                        action: hist.action,
                        value: hist.data.value,
                    };
                }
                localState = historyList.checkout(localState, info);
                historyList.refresh();
                historyList.selectCurShowNode(localState);
            }
        };

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
                        otGraph.addLinks({  //Revise Here   same with Line 163
                            userId: 0,
                            reason: "Relevant",
                            source: linkSource,
                            target: linkTarget,
                            duration: 200,
                            datetime: new Date(),
                            linkname: "Link",
                            value: 2,
                            datalink: false
                        });

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
            links = links.filter(function(li){
                let labelArr = Object.keys(nodeHash).map(function(k){
                    return nodeHash[k].label;
                });
                return labelArr.indexOf(li.source.label) >= 0 && labelArr.indexOf(li.target.label) >= 0;
            });

            link = link.data(links, function(d) {
                return d.source.label + "-" + d.target.label;
            });
            link.exit().remove();

            maxLinkValue = d3.max(links.map((d)=>d.value));
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
            simulation.force("link").links(links).iterations(10);
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
                let nodeArr = Object.keys(nodeHash).map(function(k){
                    return nodeHash[k];
                }).filter((j) => {return j.label === d.source.label || j.label === d.target.label});
                let target = null;
                let source = null;
                if(nodeArr.length != 2){
                    console.log("Error Number of nodeArr: " + nodeArr.length);
                }else{
                    if(nodeArr[0].label === d.source.label){
                        source = nodeArr[0];
                        target = nodeArr[1];
                    }else{
                        source = nodeArr[1];
                        target = nodeArr[0];
                    }
                }
                return "M" + source.x + "," + source.y
                + " L" + ((target.x + source.x)/2) + "," +((target.y + source.y)/2)
                + "," + target.x + "," + target.y;
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
                        addHistory({
                            action: 'Remove node',
                            data: newNode
                        });
                        d3.select(thisNode).remove();
                        nodeLabels[thisNodeId].remove();
                        nodeIcons[thisNodeId].remove();
                        delete nodeLabels[thisNodeId];
                        delete nodeHash[thisNodeId];
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
                        d3.select(thisLink).remove();
                        removeLink(thisLinkId);
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

                addHistory({
                    action: 'Add node',
                    data: newNode
                });
            })
            return otGraph;
        }

        otGraph.addLinks = function(newLinks){
            var newLinks = (Array.isArray(newLinks)) ? newLinks : [newLinks];
            newLinks.forEach(function(li){
                li.id = links.length;
                if(typeof li.source !== 'object') {
                    var sourceId = (graphName===null) ? li.source : graphName + li.source;
                    li.source = nodeHash[sourceId];
                }
                if(typeof li.target !== 'object') {
                    var targetId = (graphName===null) ? li.target : graphName + li.target;
                    li.target = nodeHash[targetId];
                }

                if(!li.hasOwnProperty('datalink')) li.datalink = false;
                links.push(li);
                addHistory({
                    action: 'Add link',
                    data: li
                })
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

        function removeNode(nodeId) {
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
                d.id != nodeId;
            })
        }

        function removeLink(linkId) {
            var removedLink = links.splice(linkId,1)[0];
            if(removeLink.hasOwnProperty('icon'))
            removedLink.icon.remove();
            addHistory({
                action: 'Remove link',
                data: removedLink
            });
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
                        return li.type !== query.type;
                    })
                    .map(function(n){ return li.id });
                } else if(query.datalink) {
                    linkIds = links.filter(function(li){
                        return li.datalink !== query.datalink;
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

        otGraph.fetchVisData = function(){
            let ret = [];
            let nodeRoute = historyList.backRoute(historyList.getCurShowNode());
            if(nodeRoute.mergeNode !== null){
                //merge id
            }else{
                nodeRoute = nodeRoute.nodeStack;
            }
            for(var i = 0; i < nodeRoute.length; i++){
                if(typeof visData[nodeRoute[i].nodeId] === 'undefined')continue;
                ret.push(visData[nodeRoute[i].nodeId].area); //GitTree is 1 prior to visdata and nodeid
            }
            return {
                areas: ret,
                mapZoom: (nodeRoute.length > 0)? (visData[nodeRoute[0].nodeId] ? visData[nodeRoute[0].nodeId].mapZoom : null) : null
            };
        }

        otGraph.allReset = function(){
            trackHistory = false;
            otGraph.removeNodes({all: true});
            otGraph.removeLinks({all: true});
            trackHistory = true;
        }
        otGraph.switchHist = function(choice){
            if(choice === "off"){
                trackHistory = false;
            }else{
                trackHistory = true;
            }
        }
        otGraph.setLocalState = function(curNode){
            localState = curNode;
        }
        return otGraph;
    }


})