define(function(require) {
    var logos = require("./icons"),
        dataModel = require("./model"),
        menu = require("./menu");

    return function(arg) {
        "use strict";
        var i2g = {};
        // get all the setting from input
        var options = arg || {},
            container = options.container || "body",
            domain = options.domain || [0, 1],
            graph = options.graph || options.data || {},
            width = options.width || 600,
            height = options.height || 600,
            onselect = options.onselect || function() {},
            graphId = options.graphId || "igraph-svg",
            graphName = options.graphName || "",
            scale = options.scale || 1,
            colorScheme = options.colorScheme;

        var model = dataModel({
            data: graph,
            tag: graphName
        });

        // set up the svg
        var svg = d3.select(container)
            .append("svg:svg")
                .attr("id", graphId)
                .attr("width", width)
                .attr("height", height);

        // set up the direction arrow
        svg.append("svg:defs").append("svg:marker")
              .attr("id","directionArrow")
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
            //   .attr("d", logos("info"));
              .attr("d", "M0,-5L10,0L0,5");

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
                return "black";
        }

        // set up a function to determine the size of the node (using d3)
        var nodeSize = d3.scalePow()
            .exponent(0.20)
            .domain([1, 3000])
            .range([5, 500]);

        var nodeHolderRadius = 30; // size + padding for each node structure

        // set up a function to determine the width of the link (using d3)
        var linkSize = d3.scalePow()
            .exponent(0.2)
            .domain([0, 3000])
            .range([1*scale, 6*scale]);

        var linkColor = d3.scaleOrdinal(d3.schemeCategory20);

        var g = svg.append("g"), //append a graph to plot all the links and nodes
            linkSvg = g.append("g"),
            nodeSvg = g.append("g"),
            linkIconSvg = g.append("g");

        nodeSvg.attr("stroke-width", 2).attr("stroke", "none");
        linkSvg.attr("stroke", "#BBB");

        function renderNodes() {
            var node = nodeSvg.selectAll(".graphNodes").data(model.getNodes(), d => d.id);
            node.exit().remove(); // Remove the previous nodes from the graph

            // Add updated nodes into the graph
            var nodeStruct = node.enter().append("g")
                .attr("class", "graphNodes")

            nodeStruct.append("circle")
                .attr("class", "nodeHolder")
                .attr("fill", "white")
                .attr("r", nodeHolderRadius)
                .on("click", i2g.completeAddingLink);

            //interaction for dragging and moving a node
            nodeStruct.call(
                d3.drag()
                    .on("start", drag)
                    .on("drag", drag)
                    .on("end", drag)
                );

            var labels = nodeStruct.append("text")
                .attr("class", "nodeLabels")
                .attr("dx", nodeHolderRadius)
                .attr("dy", ".35em")

            var icons = nodeStruct.append("text")
                .attr("class", "nodeIcons")
                .attr('font-family', 'FontAwesome')
                .attr('font-size', function(d) { return scale * 3 + 'em'} )
                .attr("dominant-baseline", "central")
                .style("text-anchor", "middle");


            //update existing nodes
            var allNodes = nodeStruct
                .merge(node)
                .attr("transform", function(d) {
                    return "translate(" + (d.x * width) + "," + (d.y * height) + ")";
                });

            labels.text(function(d){
                var label = (d.hasOwnProperty("label")) ? d.label : d.id;
                if(label.length > 20)
                    label = label.slice(0, 17) + "...";
                if(d.hasOwnProperty("labelPrefix"))
                    label = d.labelPrefix + label;
                return label;
            })

            icons.text((d) => { return logos(d.icon || d.type); })
                .attr("fill",  (d) => { return nodeColor(d); });
        }

        function renderLinks() {
            var links = model.getLinks();
            var link = linkSvg.selectAll(".graphLinks").data(links, function(d) {
                return d.source.id + "-" + d.target.id;
            });

            link.exit().remove(); // Remove the previous link from the graph

            linkSize.domain([0, d3.max(links.map((d)=>d.value))]);

            // Add new links to the graph
            var newLinks = link.enter()
                .append("path")
                .merge(link);

            newLinks.attr("class", "graphLinks")
                .attr("stroke-width", (d)=>linkSize(d.value))
                // .attr("stroke", (d)=>linkColor(d.dest))
                .attr("marker-mid", "url(#directionArrow)")

            newLinks.append("title").text((d)=>(d.value))

            //update exiting links
            newLinks
                .attr("d", function(d){
                    return "M" + (d.source.x * width) + "," + (d.source.y * height)
                    + " L" + (((d.target.x * width ) + (d.source.x * width ))/2) + "," +(((d.target.y * height) + (d.source.y * height))/2)
                    + "," + (d.target.x * width) + "," + (d.target.y * height);
                })
        }

        function drag(d) {
            d.x += d3.event.dx / width;
            d.y += d3.event.dy / height;
            i2g.update();
        }

        /** Add node Icon functions */
        var linkIcons = [];
        function addLinkIcon(d) {
            linkIcons[d.id] = linkIconSvg.append("g")
                .attr("pointer-events", "none");

            linkIcons[d.id].attr("transform", "translate(" +
                (d.source.x + (d.target.x-d.source.x)/2 - 8) + "," +
                (d.source.y + (d.target.y-d.source.y)/2 - 8) + ")")

            linkIcons[d.id].append("path")
                .attr("transform", "scale(0.05)")
                .attr("d", logos("info"))
                .attr("fill", "red");
        }

        //Use a temporary link for indication when adding a new link from a node
        var tempLink = {
            source: null,
            targe: null,
            svg: null
        };

        tempLink.svg = svg.append("g")
            .append("line")
            .attr("id", "tempLink")
            .attr("stroke", "#CCC")
            .attr("stroke-width", 0)
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 0)
            .attr("y2", 0)
            .style("stroke-dasharray", ("3, 3"));

        // change the destination of the temp link when move the mouse
        svg.on("mousemove", function(e){
            if(tempLink.source !== null){
                var pos = d3.mouse(this);
                tempLink.svg
                    .attr("x2", pos[0]-3)
                    .attr("y2", pos[1]-3);
            }
        });

        // modify the templink
        svg.on("click", function(d){
            if(tempLink.source !== null) {
                tempLink.source = null;
                tempLink.svg
                    .attr("stroke-width", 0)
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", 0)
                    .attr("y2", 0);
            }
        });

        i2g.startAddingLink = function(thisNodeId) {
            tempLink.source = model.nodeHash[thisNodeId];
            tempLink.target = null;
            tempLink.svg
                .attr("x1", tempLink.source.x * width)
                .attr("y1", tempLink.source.y * height)
                .attr("x2", tempLink.source.x * width)
                .attr("y2", tempLink.source.y * height)
                .attr("stroke-width", 4);
        };

        i2g.completeAddingLink = function(destNode) {
            if(tempLink.source !== null && tempLink.target === null) {
                tempLink.target = destNode;
                model.addLinks({
                    source: tempLink.source,
                    target: tempLink.target,
                    value: 2,
                    datalink: false
                })
                tempLink.source = tempLink.target = null;
                tempLink.svg
                    .attr("stroke-width", 0)
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", 0)
                    .attr("y2", 0);
                renderLinks(); // draw the link just added
            }
        };

        //update the whole graph
        i2g.update = function() {
            renderNodes();
            renderLinks();
            return i2g;
        };

        //update individual node
        i2g.updateNode = function(nodeSvgObject, props) {
            var theNode = d3.select(nodeSvgObject);
            for (var p in props) {
                theNode.attr(p, props[p]);
            }
            return i2g;
        }

        i2g.container = container;
        i2g.svg = svg;
        i2g.model = model;
        menu(i2g);
        return i2g.update();
    }
})
