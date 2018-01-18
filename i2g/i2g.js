define(function(require) {
    var logos = require('./icons');
    return function(arg) {
        'use strict';
        var options = arg || {},
            container = options.container || "body",
            domain = options.domain || [0, 1],
            graph = options.graph || {},
            width = options.width || 600,
            height = options.height || 600,
            menu = options.menu || false,
            notePanel = options.notePanel || null,
            onselect = options.onselect || function() {},
            graphId = options.graphId || 'igraph-svg',
            graphName = options.graphName || '',
            scale = options.scale || 1;

        var i2g = {},
            nodes = graph.nodes,
            links = graph.links;

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
            location: 'steelblue',
            people: 'green',
            time:  'orange',
            date: 'orange',
            day: 'orange',
            datetime: 'orange'
        }

        var nodeColor = function(d) {
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
            .stop();

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

        //=====================================================================
        // Private Functions
        //=====================================================================
        function restart() {
            // Apply the general update pattern to the nodes.
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
                        // console.log(linkTarget);
                        i2g.addLinks({
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
            links = links.filter(function(li){
                return nodeHash.hasOwnProperty(li.source.id) &&  nodeHash.hasOwnProperty(li.target.id);
            });

            link = link.data(links, function(d) {
                return d.source.id + "-" + d.target.id;
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
                        d3.select(thisNode).remove();
                        nodeLabels[thisNodeId].remove();
                        nodeIcons[thisNodeId].remove();
                        delete nodeLabels[thisNodeId];
                        delete nodeHash[thisNodeId];
                        restart();
                    } else if(key == 'annotate') {
                        d3.select(thisNode).attr('stroke', 'orange');
                        // console.log(nodeHash[thisNodeId]);
                        notePanel.setNote({
                            label: nodeHash[thisNodeId].labelPrefix+nodeHash[thisNodeId].label,
                            detail: nodeHash[thisNodeId].detail
                        })
                        notePanel.show();
                        notePanel.onsave = function() {
                            var info = notePanel.getNote();
                            info.labelPrefix = '';
                            i2g.modifyNode(thisNodeId, info);
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
        //=====================================================================
        //End of Private Functions
        //=====================================================================

        nodeMenu();
        linkMenu();


        //=====================================================================
        // Public Functions
        //=====================================================================
        i2g.addNodes = function(newNodes) {
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

            })
            return i2g;
        }

        i2g.addLinks = function(newLinks){
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

            })
            return i2g;
        };


        i2g.modifyNode = function(d, props) {
            var theNode = (typeof d == 'object') ? d : nodeHash[d];

            for(var p in props) {
                theNode[p] = props[p];
            }

            if(props.hasOwnProperty('label')) {
                labelNode(theNode);
            }
        }

        function removeNode(nodeId) {
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
        }

        i2g.removeNodes = function(query) {
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
            return i2g;
        }

        i2g.removeLinks = function(query) {
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

            return i2g;
        }

        i2g.update = function(subgraph) {
            var subgraph = subgraph || {nodes: null, links: null},
                newNodes = subgraph.nodes || [],
                newLinks = subgraph.links || [];

            if(newNodes.length) i2g.addNodes(newNodes);
            if(newLinks.length) i2g.addLinks(newLinks);

            restart();
            return i2g;
        };

        i2g.append = function(subgraph) {
            i2g.addNodes(subgraph.nodes);
            i2g.addLinks(subgraph.links);
            restart();
            return i2g;
        }

        i2g.remake = function(graph) {
            // nodes = graph.nodes;
            // nodeHash = {};

            graph.nodes.forEach(function(n){
                n.fx = null;
                n.fy = null;
            })
            i2g.addNodes(graph.nodes);
            restart();

            var newLinks = graph.links.map(function(sl){
                return {
                    source: nodeHash[sl.source.id],
                    target: nodeHash[sl.target.id],
                    value: sl.value,
                };
            });
            i2g.addLinks(newLinks);

            restart();
            return i2g;
        }

        i2g.getNodes = function(query) {
            if(typeof query === 'undefined')
                return nodes;
            else {
                return [];
            }
        };

        i2g.findNode = function(query) {
            return i2g.getNodes(query)[0];
        }

        i2g.getLinks = function() { return links;};

        return i2g;
    }
})
