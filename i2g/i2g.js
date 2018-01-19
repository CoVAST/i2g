define(function(require) {
    var logos = require('./icons'); 

    return function(arg) {
        'use strict';

        // get all the setting from input
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
            scale = options.scale || 1,
            colorScheme = options.colorScheme;

        // initialize the graph as a object and initialize the graph nodes and links
        var i2g = {},
            nodes = graph.nodes,
            links = graph.links;

        // pretty useless variable, maybe remove later
        var maxLinkValue = 0,
            nodeCounter = 0;

        // set up the svg
        var svg = d3.select(container).append('svg:svg');
        svg.attr('id', graphId)
        .attr("width", width)
        .attr("height", height)
        .style("border", "solid 3px black");

        // set up the direction arrow
        svg.append("svg:defs").append("svg:marker")
              .attr("id",'directionArrow')
              .attr("viewBox", "0 -5 10 10")
               .attr("markerUnits", "userSpaceOnUse")
              .attr("refX", 5)
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

        // useless variable
        var linkColor = d3.scaleOrdinal(d3.schemeCategory20);

        // set up node type color
        var nodeTypeColor = {
            location: colorScheme.area,
            people: colorScheme.people,
            time: colorScheme.time,
            date: colorScheme.time,
            day: colorScheme.time,
            datetime: colorScheme.time
        }

        // set up a nodeColor function to determine the color of the node based on its type
        var nodeColor = function(d) {
            if(nodeTypeColor.hasOwnProperty(d.type))
                return nodeTypeColor[d.type];
            else
                return 'black';
        }

        // set up a function to determine the size of the node (using d3)
        var nodeSize = d3.scalePow()
            .exponent(0.20)
            .domain([1, 3000])
            .range([5, 500]);

        // set up a function to determine the width of the link (using d3)
        var linkSize = d3.scalePow()
            .exponent(0.2)
            .domain([0, 3000])
            .range([1*scale, 6*scale]);

        // set up a function to plot the graph use d3 force diagram
        var simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("link", d3.forceLink(links).distance(200).strength(1).iterations(20))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked)
            // .force("x", d3.forceX())
            // .force("y", d3.forceY())
            // .alphaTarget(0.3)
            .stop();



        /** Use a temp link to show the link when add a new link */
        var linkSource = null,
            linkTarget = null,
            newArrivingNode = null;

        var tempLink = svg.append('g')
            .append('line')
            .attr('id', 'tempLink')
            .attr('stroke', '#CCC')
            .attr('stroke-width', 0)
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', 0)
            .attr('y2', 0)
            .style("stroke-dasharray", ("3, 3"));

        // change the destination of the temp link when move the mouse
        svg.on('mousemove', function(e){
            if(linkSource !== null){
                var pos = d3.mouse(this);
                tempLink.attr('x2', pos[0]-3)
                    .attr('y2', pos[1]-3);
            }
        });





        var g = svg.append("g"), //append a graph to plot all the links and nodes
            link = g.append("g").attr("stroke", "#BBB").selectAll(".link"),
            node = g.append("g").attr("stroke-width", 2).attr("stroke", "none").selectAll(".node");

        var linkIcons = [], // unknown
            linkLabels = []; // unknown

        var icons = g.append("g"), // append a graph to plot all the node icons
            nodeIcons = {};

        var nodeInfo = g.append("g"), // append a graph to plot all the node names
            nodeLabels = {};

        var nodeHash = {}; // unknown probably to store the hashcode of nodes

        restart(); // call restart function







        //=====================================================================
        // Private Functions
        //=====================================================================
        
        /** Set up a restart function to plot all the nodes and links. */
        function restart() {

            // Apply the general update pattern to the nodes.
            nodes = Object.keys(nodeHash).map(function(k){
                return nodeHash[k];
            });

            node = node.data(nodes, function(d) {
                return d.id;
            });

            // Remove the previous nodes from the graph
            node.exit().remove();

            // Add updated nodes into the graph
            node = node.enter()
                .append("circle")
                .attr('class', 'nodeHolder')
                // .attr("fill", function(d) {
                //     return nodeColor(d.type);
                // })
                .attr("fill", "white")
                .attr("r", 30)
                .merge(node)
                .on('click', function(d){   
                    // d.fx = d3.mouse(this)[0];
                    // d.fy = d3.mouse(this)[1];
                // console.log('clicked on node', d.id);

                // modify the templink
                if(linkSource !== null && linkTarget === null) {
                        linkTarget = d;
                        // console.log(linkTarget);
                        i2g.addLinks({
                            source: linkSource,
                            target: linkTarget,
                            value: 2,
                            datalink: false
                        })

                        // set temp link to original state
                        linkSource = linkTarget = null;
                        
                        tempLink
                            .attr('stroke-width', 0)
                            .attr('x1', 0)
                            .attr('y1', 0)
                            .attr('x2', 0)
                            .attr('y2', 0);

                        restart(); // call restart again to update the graph
                    }
                })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
                );

            // Unknown action 
            node
            .append('title')
            .text((d)=>{ if(d.detail) return d.detail});
            // console.log(node);
            
            // For each node add icon and labels
            node.data(nodes, function(d){
                addNodeIcon(d);
                addNodeLabel(d);
            });

            // Apply the general update pattern to the links.
            links = links.filter(function(d){
                return nodeHash.hasOwnProperty(d.source.id) && nodeHash.hasOwnProperty(d.target.id);
            });

            link = link.data(links, function(d) {
                return d.source.id + "-" + d.target.id;
            });

            // Remove the previous link from the graph
            link.exit().remove();

            maxLinkValue = d3.max(links.map((d)=>d.value));
            linkSize.domain([0, maxLinkValue]);

            // Add new links to the graph
            link = link.enter()
                .append("path")
                .attr('class', 'graphLinks')
                .attr("stroke-width", (d)=>linkSize(d.value))
                // .attr("stroke", (d)=>linkColor(d.dest))
                .attr("marker-mid", "url(#directionArrow)")
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

        /** Unknown Set up a ticked function to plot all the nodes and links with force layout. */
        function ticked() {
            node.attr("cx", function(d) {return d.x;})
                .attr("cy", function(d) {return d.y;})

            // link.attr("x1", function(d) {return d.source.x;})
            //     .attr("y1", function(d) {return d.source.y;})
            //     .attr("x2", function(d) {return d.target.x;})
            //     .attr("y2", function(d) {return d.target.y;});

            var sourceXChange,
                sourceYChange,
                targetXChange,
                targetYChange;

            sourceXChange = sourceYChange = targetYChange = 0;
            targetXChange = 0;

            link.attr("d", function(d){
                return "M" + (d.source.x + sourceXChange) + "," + (d.source.y + sourceYChange)
                + " L" + (((d.target.x + targetXChange) + (d.source.x + sourceXChange))/2) + "," +(((d.target.y + targetYChange) + (d.source.y + sourceYChange))/2)
                + "," + (d.target.x + targetXChange) + "," + (d.target.y + targetYChange);
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


        /** Set up a group of drag functions. */
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


        /** Add node label functions */
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
                label = label.slice(0, 17) + '...';
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


        /** Add node Icon functions */
        function addNodeIcon(d) {
            if(!nodeIcons.hasOwnProperty(d.id) || nodeIcons[d.id] === null){
                nodeIcons[d.id] = icons.append("g")
                    .attr("pointer-events", "none");

                nodeIcons[d.id]._icon = nodeIcons[d.id].append("path")
                    .attr("class", "nodeIcons")
                    .attr("transform", "scale(" + scale * 0.1 + ")")
                    .attr("d", logos(d.icon || d.type))
                    .attr("fill", nodeColor(d));
            }
        }

        /** Add node Icon functions */
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
            var iconInfo = nodeIcons[d.id].node().getBBox();
            nodeIcons[d.id].attr("transform", "translate(" + (d.x - (iconInfo.width / 2)) + ", " + (d.y - (iconInfo.width / 2) - 4) + ")");
        }




        /** Set up a group of context menu functions. */
        function svgMenu() {
            $.contextMenu({
                selector: container, 
                callback: function(key, options) {
                    var newNodeType;
                    var newNodePosition = $(".context-menu-root").first().position();
                    if(key == 'location') {
                        newNodeType = 'location';
                    } else if(key == 'people') {
                        newNodeType = 'people';
                    } else if(key == 'time') {
                        newNodeType = 'time';
                    }
                    i2g.addNodes({
                        label: 'New ' + key,
                        type: newNodeType,
                        fx: newNodePosition.left,
                        fy: newNodePosition.top,
                        value: 0,
                        datalink: false
                    }).update();
                },
                items: {
                    addNode: {
                        name: "Add node",
                        icon: "fa-plus-square",
                        items: {
                            location: {
                                name: "Location",
                                icon: "fa-map-marker"
                            },
                            people: {
                                name: "People",
                                icon: "fa-user"
                            },
                            time: {
                                name: "Time",
                                icon: "fa-clock-o"
                            }
                        }
                    }
                }
            });
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

        svgMenu();
        nodeMenu();
        linkMenu();


        //=====================================================================
        // Public Functions
        //=====================================================================

        /** This is a function for adding a new node. */
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
                if(graphName !== null)
                    newNode.id = graphName + newNode.id;
                nodeHash[newNode.id] = newNode;

                addNodeIcon(newNode);
                addNodeLabel(newNode);

            });
            return i2g;
        }

        /** This is a function for adding a new link. */
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

        /** This is a function for modifying a node. */
        i2g.modifyNode = function(d, props) {
            var theNode = (typeof d == 'object') ? d : nodeHash[d];

            for(var p in props) {
                theNode[p] = props[p];
            }

            if(props.hasOwnProperty('label')) {
                labelNode(theNode);
            }
        }

        /** This is a sub function for removing a node. */
        function removeNode(nodeId) {
            nodeIcons[nodeId]._icon.remove();
            nodeIcons[nodeId].remove();
            nodeLabels[nodeId].remove();
            delete nodeIcons[nodeId];
            delete nodeLabels[nodeId];
            delete nodeHash[nodeId];
            nodes = nodes.filter(function(d){
                d.id != nodeId;
            });
        }

        /** This is a sub function for removing a link. */
        function removeLink(linkId) {
            var removedLink = links.splice(linkId,1)[0];
            if(removeLink.hasOwnProperty('icon'))
            removedLink.icon.remove();
        }

        /** This is a function for removing a list of nodes. */
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

        i2g.remake = function() {
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
