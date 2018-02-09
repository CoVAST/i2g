define(function(require) {
    var logos = require("./icons"),
        dataModel = require("./model"),
        menu = require("./menu")
        widget = require("./ui/widget");

    return function(arg) {
        "use strict";
        var i2g = {};
        // get all the setting from input
        var options = arg || {},
            container = options.container || "body",
            subI2g = options.subI2g || null,
            domain = options.domain || [0, 1],
            graph = options.graph || options.data || {},
            width = options.width || 600,
            height = options.height || 600,
            onselect = options.onselect || function() {},
            graphId = options.graphId || "igraph-svg",
            graphName = options.graphName || "",
            scale = options.scale || 1,
            colorScheme = options.colorScheme;

        var tooltipHash = {};
        var dblclickedHash = {};

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

        // set up link label gradient
        var linkLabelGradient = svg.append("svg:defs").append("radialGradient")
           .attr("id", "svgGradient")
           .attr("x1", "0%")
           .attr("x2", "100%")
           .attr("y1", "0%")
           .attr("y2", "100%");

        linkLabelGradient.append("stop")
            .attr('class', 'start')
            .attr("offset", "0%")
            .attr("stop-color", "white")
            .attr("stop-opacity", 1);

        linkLabelGradient.append("stop")
            .attr('class', 'end')
            .attr("offset", "100%")
            .attr("stop-color", "white")
            .attr("stop-opacity", 0);

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
            if(d.color == "default") {
                if(nodeTypeColor.hasOwnProperty(d.type))
                    return nodeTypeColor[d.type];
                else
                    return "black";
            } else {
                return d.color;
            }
        }

        var nodeHolderRadius = 12; // size + padding for each node structure
        var linkLabelWidth = 120;
        var linkLabelHeight = 60; 

        // set up a function to determine the size of the node (using d3)
        var nodeSize = d3.scalePow()
            .exponent(1)
            .range([1*scale, 4*scale]);

        // set up a function to determine the width of the link (using d3)
        var linkSize = d3.scalePow()
            .exponent(1)
            .range([1*scale, 4*scale]);

        var indicatorColor = d3.scaleOrdinal(d3.schemeCategory20);

        var g = svg.append("g"), //append a graph to plot all the links and nodes
            linkSvg = g.append("g"),
            nodeSvg = g.append("g"),
            linkIconSvg = g.append("g");


        function renderNodes() {
            var nodes = model.getNodes();
            var node = nodeSvg.selectAll(".graphNodes").data(nodes, d => d.id);
            node.exit().remove(); // Remove the previous nodes from the graph

            nodeSize.domain([1, 4]);

            // Add updated nodes into the graph
            var nodeStruct = node.enter().append("g")
                .attr("class", "graphNodes")
                .on("click", i2g.completeAddingLink)
                .on("mouseover", (d)=> {
                    if(dblclickedHash[d.id] == null) {
                        if(!tooltipHash.hasOwnProperty(d.id)) {
                            var nodeTooltip = widget({
                                category: "tooltip",
                                label: d.label,
                                annotation: d.annotation,
                                vis: d.vis,
                                color: indicatorColor(parseInt(d.id)),
                                callback: function() {
                                    tooltipHash[d.id].removeWidget();
                                    delete tooltipHash[d.id];
                                    delete dblclickedHash[d.id];
                                    circle.attr("stroke", (d) => {
                                        if(dblclickedHash[d.id]) {
                                            return indicatorColor(parseInt(d.id));
                                        } else {
                                            return "none";
                                        }
                                    });
                                }
                            });
                            tooltipHash[d.id] = nodeTooltip;
                        }
                        var top = d3.event.pageY + 5;
                        var left = d3.event.pageX + 5;
                        tooltipHash[d.id].changePosition(top, left);
                    }
                })
                .on("mousemove", (d) => {
                    if(dblclickedHash[d.id] == null) {
                        var top = d3.event.pageY + 5;
                        var left = d3.event.pageX + 5;
                        tooltipHash[d.id].changePosition(top, left);
                    }
                })
                .on("mouseleave", (d) => {
                    if(dblclickedHash[d.id] == null) {
                        tooltipHash[d.id].removeWidget();
                        delete tooltipHash[d.id];
                    }
                })
                .on("dblclick", (d) => {
                    dblclickedHash[d.id] = true;
                    tooltipHash[d.id].indicate();
                    circle.attr("stroke", (d) => {
                        if(dblclickedHash[d.id]) {
                            return indicatorColor(parseInt(d.id));
                        } else {
                            return "none";
                        }
                    });
                });

            var circle = nodeStruct.append("circle")
                .attr("class", "nodeHolder")
                .attr("fill", "transparent")
                .attr("stroke-width", "3px")
                .attr("stroke", "none");

            //interaction for dragging and moving a node
            nodeStruct.call(
                d3.drag()
                    .on("start", drag1)
                    .on("drag", drag2)
                    .on("end", drag3)
            );

            var icons = nodeStruct.append("text")
                .attr("class", "nodeIcons")
                .attr('font-family', 'FontAwesome')
                .attr("dominant-baseline", "central")
                .style("text-anchor", "middle");

            var textBox = nodeStruct.append("rect")
                .attr("class", "nodeRect")
                .attr("fill", "none");

            var labels = nodeStruct.append("text")
                .attr("class", "nodeLabels")
                .attr("id", d => "nodeLabel_" + d.id)
                .attr("dominant-baseline", "central");

            //update existing nodes
            var allNodes = nodeStruct
                .merge(node)
                .attr("transform", function(d) {
                    return "translate(" + (d.x * width) + "," + (d.y * height) + ")";
                });

            allNodes.selectAll(".nodeHolder")
                .attr("r", (d) => nodeSize(d.size) * nodeHolderRadius + 10);

            allNodes.selectAll(".nodeLabels")
                .attr("dx", (d) => {
                    if(d.type == "default") {
                        return null;
                    } else {
                        return d.size * nodeHolderRadius + 2;
                    }
                })
                .style("text-anchor", (d) => {
                    if(d.type == "default") {
                        return "middle";
                    } else {
                        return "start";
                    }
                })
                .style("font-size", (d) => {
                    return d.size * 0.7 + "em";
                })
                .text(function(d){
                    var label = (d.hasOwnProperty("label")) ? d.label : d.id;
                    return labelClip(label);
                })

            allNodes.selectAll(".nodeIcons")
                .text(d => logos(d.icon || d.type))
                .attr("fill", d => nodeColor(d))                
                .attr('font-size', (d) => { return d.size * 1.5 + 'em'} );

            allNodes.selectAll(".nodeRect")
                .attr("stroke", d => d.color == "default" ? "#888" : d.color)
                .attr("stroke-width", d => d.size)
                .attr("width", d => getTextWidth(d.label, "bold " + d.size * 0.7 + "em sans-serif")[0] + 10)
                .attr("height", d => getTextWidth(d.label, "bold " + d.size * 0.7 + "em sans-serif")[1] + 10)
                .attr("x", d => -getTextWidth(d.label, "bold " + d.size * 0.7 + "em sans-serif")[0] / 2 - 5)
                .attr("y", d => -getTextWidth(d.label, "bold " + d.size * 0.7 + "em sans-serif")[1] / 2 - 5)
                .style("display", (d) => {
                    if(d.type == "default") {
                        return null;
                    } else {
                        return "none";
                    }
                });
        }

        function getTextWidth(label, font) {
            // re-use div object for better performance
            var sampleDiv = getTextWidth.sampleDiv || (getTextWidth.sampleDiv = $('<div>').appendTo("body"));
            sampleDiv.css("position", "absolute");
            sampleDiv.css("visibility", "hidden");
            sampleDiv.css("white-space", "nowrap");
            sampleDiv.css("font", font);
            label = labelClip(label);
            sampleDiv.text(label);
            return [sampleDiv.width(), sampleDiv.height()];
        }

        function labelClip(label) {
            if(label.length > 20) {
                label = label.slice(0, 17) + "...";
            }
            return label;
        }

        function renderLinks() {
            var links = model.getLinks();
            var link = linkSvg.selectAll(".graphLinks").data(links, function(d) {
                return d.source.id + "-" + d.target.id;
            });

            link.exit().remove(); // Remove the previous link from the graph

            linkSize.domain([1, 4]);

            var linkStruct = link.enter().append("g")
                .attr("class", "graphLinks");

            var newLinks = linkStruct.append("path");

            newLinks
                .attr("class", "graphLinkLine")
                .attr("marker-end", (d) => { return "url(#directionArrow_" + d.id + ")"; });

            // set up the direction arrow
            var linkArrow = linkStruct.append("svg:defs").append("svg:marker")
                .attr("class", "directionArrow")
                .attr("id", (d) => { return "directionArrow_" + d.id; })
                .attr("viewBox", "0 -5 10 10")
                .attr("markerUnits", "userSpaceOnUse")
                .attr("refX", 5)
                .attr("refY", 0)
                .attr("markerWidth", 10)
                .attr("markerHeight", 10)
                .attr("orient", "auto")
                .append("svg:path")
                //   .attr("transform", "scale(0.05)")
                //   .attr("d", logos("info"));
                .attr("d", "M0,-5L10,0L0,5");

            var linkLabels = linkStruct.append("g")
                .attr("class", "linkLabels");
            
            var linkLabelBox = linkLabels.append("ellipse")
                .attr("class", "linkLabelBox")
                .attr("rx", linkLabelWidth / 2)
                .attr("ry", linkLabelHeight / 2)
                .attr("stroke", "none")
                .attr("fill", "url(#svgGradient)");

            var linkLabelText = linkLabels.append("text")
                .attr("class", "linkLabelText")
                .attr("dominant-baseline", "central")
                .style("text-anchor", "middle");

            linkStruct.append("title").text((d)=>(d.label));

            //update existing links
            var allLinks = linkStruct
                .merge(link);

            //update exiting links
            allLinks.selectAll('.graphLinkLine')
                .attr("stroke-width", (d) => (linkSize(d.size)))
                .attr("d", function(d){
                    
                    var lineInfo = calculateLine(d);
                    var x1 = lineInfo[0],
                        y1 = lineInfo[1],
                        x2 = lineInfo[2],
                        y2 = lineInfo[3];

                    return "M" + x1 + "," + y1
                    + " L" + ((x1 + x2) / 2) + ","
                    +((y1 + y2) / 2)
                    + "," + x2 + "," + y2;
                })
                .attr("stroke", d => d.color == "default" ? "#BBB" : d.color);

            // update link arrow
            allLinks.selectAll('.directionArrow')
                .attr("fill", d => d.color == "default" ? "#BBB" : d.color);

            // update link labels
            allLinks.selectAll('.linkLabels')
                .attr("transform", function(d) {
                    var lineInfo = calculateLine(d);
                    var x1 = lineInfo[0],
                        y1 = lineInfo[1],
                        x2 = lineInfo[2],
                        y2 = lineInfo[3];

                    return "translate(" + ((x1 + x2) / 2) + "," + ((y1 + y2) / 2) + ")";
                })
                .style("display", (d) => {
                    if(d.label == undefined || d.label == "") {
                        return "none";
                    } else {
                        return null;
                    }
                });

            allLinks.selectAll('.linkLabelText')
                .text((d) => d.label);
        }

        function calculateLine(d) {
            var x1 = d.source.x,
                x2 = d.target.x,
                y1 = d.source.y,
                y2 = d.target.y;

            var x1c, x2c, y1c, y2c;
            var tline = nodeHolderRadius;
            var difference = 5;
            var sourceSize = d.source.size;
            var targetSize = d.target.size;

            var dx = (x2 - x1) * width;
            var dy = (y2 - y1) * height;

            
            if(d.source.type == "default") {
                var ratio = Math.min(Math.abs((getTextWidth(d.source.label, "bold " + sourceSize * 0.7 + "em sans-serif")[1] / 2 + 5) / dy), 
                    Math.abs((getTextWidth(d.source.label, "bold " + sourceSize * 0.7 + "em sans-serif")[0] / 2 + 5) / dx));
            } else {
                var ratio = (sourceSize * tline + difference) / Math.sqrt(dx * dx + dy * dy);
            }
            x1c = dx * ratio;
            y1c = dy * ratio;
            
            if(d.target.type == "default") {
                var ratio = Math.min(Math.abs((getTextWidth(d.target.label, "bold " + targetSize * 0.7 + "em sans-serif")[1] / 2 + 10) / dy), 
                    Math.abs((getTextWidth(d.target.label, "bold " + targetSize * 0.7 + "em sans-serif")[0] / 2 + 12) / dx));
            } else {
                var ratio = (targetSize * tline + difference) / Math.sqrt(dx * dx + dy * dy);
            }
            x2c = -dx * ratio;
            y2c = -dy * ratio;

            return [(x1 * width) + x1c, (y1 * height) + y1c, (x2 * width ) + x2c, (y2 * height) + y2c];
        }

        function drag1(d) {
            if(dblclickedHash[d.id] == null) {
                $(".widget").hide();
            }
        }

        function drag2(d) {
            d.x += d3.event.dx / width;
            d.y += d3.event.dy / height;
            i2g.update();
            if(dblclickedHash[d.id] == null) {
                $(".widget").hide();
            }
        }

        function drag3(d) {
            if(dblclickedHash[d.id] == null) {
                var top = d3.event.sourceEvent.pageY + 5;
                var left = d3.event.sourceEvent.pageX + 5;
                tooltipHash[d.id].changePosition(top, left);
                $(".widget").show();
            }
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
                    size: 1,
                    datalink: false,
                    label: "new relation",
                    color: tempLink.source.color,
                    annotation: "",
                    vis: ""
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

        //update individual svg object
        i2g.updateObject = function(SvgObject, props) {
            var theObject = d3.select(SvgObject);
            for (var p in props) {
                theObject.attr(p, props[p]);
            }
            return i2g;
        }

        i2g.updateScreen = function(newWidth, newHeight) {
            width = newWidth;
            height = newHeight;
            svg.attr("width", width).attr("height", height);
        }

        i2g.subI2g = subI2g;
        i2g.container = container;
        i2g.svg = svg;
        i2g.model = model;
        menu(i2g);
        return i2g.update();
    }
})
