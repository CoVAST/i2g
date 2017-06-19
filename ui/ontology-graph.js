define(function(require) {
    var logos = require('./icons');
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
            colorScheme = options.colorScheme;

        var nodes = graph.nodes,
            links = graph.links;

        var maxLinkValue = 0;

        var svg = d3.select(container).append('svg:svg');
        svg.attr("width", width).attr("height", height).attr('id', 'igraph-svg');

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
              .attr("stroke", "none")
              .attr("fill", "purple")
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
            .range([1, 10]);

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
            node = g.append("g").attr("stroke", "none").selectAll(".node");

        var linkCursors = {};


        var icons = g.append("g"),
            nodeIcons = {};

        var nodeInfo = g.append("g"),
            nodeLabels = {};

        var nodeHash = {};

        restart();

        var linkSource = null,
            linkTarget = null;

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
                .attr("r", 20)
                .merge(node)
                .on('click', function(d){
                    d.fx = d3.mouse(this)[0];
                    d.fy = d3.mouse(this)[1];
                    if(linkSource === null && linkTarget === null) {
                        linkSource = d;
                    } else if(linkSource !== null && linkTarget === null) {
                        linkTarget = d;

                        links.push({
                            source: linkSource,
                            target: linkTarget,
                            value: 10,
                        })

                        linkSource = linkTarget = null;
                        restart();
                    }
                })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended))

            // console.log(node);
            node.data(nodes, function(d){
                addIcon(d);
                addLabel(d);
            });

            // Apply the general update pattern to the links.
            //
            links = links.filter(function(li){
                console.log(li);
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
                .attr("stroke-width", (d)=>linkSize(d.value))
                // .attr("stroke", (d)=>linkColor(d.dest))
                .attr("marker-mid", "url(#end)")
                .merge(link);

            link.append('title')
                .text((d)=>(d.value))

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
                updateLabel(d);
                updateIcon(d);

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

        function addLabel(d) {
            if (!nodeLabels.hasOwnProperty(d.id)) {
                var label = (d.hasOwnProperty('label')) ? d.label : d.id;
                if(d.type=='people') label = 'P' + label;
                if(label.length > 20) label = label.slice(0, 7) + '...';
                nodeLabels[d.id] = nodeInfo.append("text")
                    .attr("dx", 20)
                    .attr("dy", ".35em")
                    .attr("x", d.x)
                    .attr("y", d.y)
                    .text(label);
            }
        }

        function updateLabel(d) {
            if (nodeLabels.hasOwnProperty(d.id)) {
                nodeLabels[d.id].attr("x", d.x);
                nodeLabels[d.id].attr("y", d.y);
            }
        }

        function addIcon(d) {
            if(!nodeIcons.hasOwnProperty(d.id)){
                nodeIcons[d.id] = icons.append("g")
                    .attr("pointer-events", "none");

                nodeIcons[d.id].append("path")
                    .attr("transform", "scale(0.1)")
                    .attr("d", logos(d.type))
                    .attr("fill", nodeColor(d))
            }
        }

        function updateIcon(d) {
            nodeIcons[d.id]
            .attr("transform", "translate(" + (d.x-20) + "," + (d.y-20) + ")")
        }

        function nodeMenu() {
            $.contextMenu({
                selector: '.nodeHolder',
                callback: function(key, options) {
                    if(key == 'removeNode') {
                        var thisNode = this[0],
                            thisNodeId = thisNode.__data__.id;
                        d3.select(thisNode).remove();
                        nodeLabels[thisNodeId].remove();
                        nodeIcons[thisNodeId].remove();
                        delete nodeLabels[thisNodeId];
                        delete nodeHash[thisNodeId];
                        restart();
                    } else if(key == 'addNotes') {
                        notePanel.show();
                    }
                },
                items: {
                    removeNode: {name: "Remove this node", icon: "fa-times"},
                    addLink: {name: "Add link", icon: "fa-long-arrow-right"},
                    addNotes: {name: "Add notes", icon: "fa-commenting"},
                }
            });
        }
        nodeMenu();



        var otGraph = {};

        otGraph.addNodes = function(newNodes) {
            var newNodes = (Array.isArray(newNodes)) ? newNodes : [newNodes];
            newNodes.forEach(function(newNode){
                var pos = newNode.pos || [width/2, height/2];
                if(!newNode.hasOwnProperty('id')) newNode.id = nodes.length;
                if(!newNode.hasOwnProperty('datalink')) newNode.datalink = false;
                newNode.x = pos[0];
                newNode.y = pos[1];
                nodeHash[newNode.id] = newNode;

                addIcon(newNode);
                addLabel(newNode);
            })
            return otGraph;
        }

        otGraph.addLinks = function(newLinks){
            var newLinks = (Array.isArray(newLinks)) ? newLinks : [newLinks];
            newLinks.forEach(function(li){

                li.source = nodeHash[li.source];
                li.target = nodeHash[li.target];
                    console.log(li, nodeHash);
                if(!li.hasOwnProperty('datalink')) li.datalink = false;
                links.push(li);
            })
            return otGraph;
        };

        function removeNode(nodeId) {
            nodeLabels[nodeId].remove();
            nodeIcons[nodeId].remove();
            delete nodeLabels[nodeId];
            delete nodeHash[nodeId];
        }

        function removeLink(linkId) {
            links.splice(linkId,1);
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
            nodes = graph.nodes;
            nodeHash = {};
            nodes.forEach(function(n){
                nodeHash[n.id] = n;
                n.fx = null;
                n.fy = null;
            })
            links = graph.links.map(function(sl){
                return {
                    source: nodeHash[sl.source.id],
                    target: nodeHash[sl.target.id],
                    value: sl.value,
                };
            });

            restart();
            return otGraph;
        }

        otGraph.getNodes = function() { return nodes;};
        otGraph.getLinks = function() { return links;};

        return otGraph;
    }
})
