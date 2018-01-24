define(function(require) {
    var logos = require('./icons'),
        dataModel = require('./model'),
        nodePad = require('./ui/nodePad'),
        menu = require('./menu');

    return function(arg) {
        'use strict';

        // get all the setting from input
        var options = arg || {},
            container = options.container || "body",
            domain = options.domain || [0, 1],
            graph = options.graph || options.data || {},
            width = options.width || 600,
            height = options.height || 600,
            onselect = options.onselect || function() {},
            graphId = options.graphId || 'igraph-svg',
            graphName = options.graphName || '',
            scale = options.scale || 1,
            colorScheme = options.colorScheme;


        var model = dataModel({
            data: graph,
            tag: graphName

        });


        var i2g = {},
            nodes = model.getNodes(),
            links = model.getLinks();


        /** Use a temp link to show the link when add a new link */
        var tempLink = {
            source: null,
            targe: null,
            svg: null
        }

        // set up the svg
        var svg = d3.select(container).append('svg:svg');
        svg.attr('id', graphId)
        .attr("width", width)
        .attr("height", height)
        .style("border", "solid 3px black")
        .on('click', function(d){
            // modify the templink
            if(tempLink.source !== null) {
                //reset tempLink.source
                tempLink.source = null;

                tempLink.svg
                    .attr('stroke-width', 0)
                    .attr('x1', 0)
                    .attr('y1', 0)
                    .attr('x2', 0)
                    .attr('y2', 0);

                renderLinks(); // call restart again to update the graph
            }
        });

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
        // var simulation = d3.forceSimulation(nodes)
        //     .force("charge", d3.forceManyBody().strength(-1000))
        //     .force("link", d3.forceLink(links).distance(200).strength(1).iterations(20))
        //     .force("center", d3.forceCenter(width / 2, height / 2))
        //     .on("tick", ticked)
            // .force("x", d3.forceX())
            // .force("y", d3.forceY())
            // .alphaTarget(0.3)
            // .stop();

        tempLink.svg = svg.append('g')
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

            if(tempLink.source !== null){
                var pos = d3.mouse(this);

                tempLink.svg
                    .attr('x2', pos[0]-3)
                    .attr('y2', pos[1]-3);
            }
        });

        var g = svg.append("g"), //append a graph to plot all the links and nodes
            link = g.append("g").attr("stroke", "#BBB").selectAll(".link"),
            nodeSvg = g.append("g");

        nodeSvg.attr("stroke-width", 2).attr("stroke", "none");

        var linkIcons = [], // unknown
            linkLabels = []; // unknown

        var icons = g.append("g"), // append a graph to plot all the node icons
            nodeIcons = {};

        var nodeInfo = g.append("g"), // append a graph to plot all the node names
            nodeLabels = {};


        renderNodes(); // call restart function
        renderLinks(); // call restart function


        /** Set up a restart function to plot all the nodes and links. */
        function renderNodes() {
            nodes = model.getNodes();
            nodes.forEach(function(d){ d.x = d.fx; d.y = d.fy;})

            var node = nodeSvg.selectAll("circle").data(nodes);

            // Remove the previous nodes from the graph
            node.exit().remove();

            // Add updated nodes into the graph
            var nodeStruct = node.enter();

            nodeStruct.append("circle")
                // .merge(node)
                .attr('class', 'nodeHolder')
                // .attr("fill", function(d) {
                //     return nodeColor(d.type);
                // })
                .attr("cx", function(d) { return d.fx; })
                .attr("cy", function(d) { return d.fy; })
                .attr("fill", "white")
                .attr("r", 30)
                .on('click', function(d){

                    // modify the templink
                    if(tempLink.source !== null && tempLink.target === null) {
                        tempLink.target = d;
                        // console.log(tempLink.target);
                        model.addLinks({
                            source: tempLink.source,
                            target: tempLink.target,
                            value: 2,
                            datalink: false
                        })

                        // set temp link to original state
                        tempLink.source = tempLink.target = null;

                        tempLink.svg
                            .attr('stroke-width', 0)
                            .attr('x1', 0)
                            .attr('y1', 0)
                            .attr('x2', 0)
                            .attr('y2', 0);

                        renderLinks(); // call restart again to update the graph
                    }
                })
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended)
                );

            // For each node add icon and label
            nodes.forEach(function(d){
                addNodeIcon(d);
                addNodeLabel(d);
                updateNodeLabel(d);
                updateNodeIcon(d);
            })
        }

        function renderLinks() {

            // Apply the general update pattern to the links.
            links = model.getLinks();

            link = link.data(links, function(d) {
                return d.source.id + "-" + d.target.id;
            });

            // Remove the previous link from the graph
            link.exit().remove();

            linkSize.domain([0, d3.max(links.map((d)=>d.value))]);

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

            link.attr("d", function(d){
                return "M" + (d.source.x ) + "," + (d.source.y)
                + " L" + (((d.target.x ) + (d.source.x ))/2) + "," +(((d.target.y ) + (d.source.y ))/2)
                + "," + (d.target.x) + "," + (d.target.y);
            })


            // link.data(links, function(li){
            //     if(!li.hasOwnProperty('icon'))
            //         addLinkIcon(li);
            // })
            // Update and restart the simulation.
            // simulation.nodes(nodes);
            // simulation.force("link").links(links).iterations(10);
            // simulation.alphaTarget(0.3).restart();
        }

        function updateNode(d) {
            updateNodeLabel(d);
            updateNodeIcon(d);

            link.filter(function(li){
                return li.source.id == d.id || li.target.id == d.id;
            })
            .attr("d", function(d){
                return "M" + (d.source.x ) + "," + (d.source.y)
                + " L" + (((d.target.x ) + (d.source.x ))/2) + "," +(((d.target.y ) + (d.source.y ))/2)
                + "," + (d.target.x) + "," + (d.target.y);
            })
        }

        /** Set up a group of drag functions. */
        function dragstarted(d) {
            // if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            updateNode(d);

        }

        function dragged(d) {
            d.x = d.fx = d3.event.x;
            d.y = d.fy = d3.event.y;
            d3.select(this).attr('cx', d.x).attr('cy', d.y);
            updateNode(d);
        }

        function dragended(d) {
            // if (!d3.event.active) simulation.alphaTarget(0);
            //   this.style.fill = selectionColor(d.id);
            onselect.call(this, d);
            updateNode(d);
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
                nodeIcons[d.id]._icon = nodeIcons[d.id].append("path");
                drawNodeIcon(d);
            }
        }

        function drawNodeIcon(d) {
            nodeIcons[d.id]._icon
                .attr("class", "nodeIcons")
                .attr("transform", "scale(" + scale * 0.1 + ")")
                .attr("d", logos(d.icon || d.type))
                .attr("fill", nodeColor(d));
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

        i2g.addNode = function(newNode) {
            model.addNodes(newNode);
            addNodeIcon(newNode);
            addNodeLabel(newNode);
            return i2g;
        }

        i2g.addNodes = function(newNodes){
            model.addNodes(newNodes);
            return i2g;
        }

        i2g.removeNode = function(nodeId) {
            model.removeNode(nodeId);
            nodeIcons[nodeId]._icon.remove();
            nodeIcons[nodeId].remove();
            nodeLabels[nodeId].remove();
            delete nodeIcons[nodeId];
            delete nodeLabels[nodeId];
            return i2g;
        }

        i2g.update = function () {
            renderNodes();
            renderLinks();
            return i2g;
        }

        i2g.tempLink = tempLink;
        i2g.model = model;
        i2g.container = container;
        menu.svgMenu(i2g);
        menu.nodeMenu(i2g);
        menu.linkMenu(i2g);


        return i2g;
    }
})
