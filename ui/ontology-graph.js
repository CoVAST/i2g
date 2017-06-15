define(function(require) {
    var logos = require('./icons');
    return function(arg) {
        var options = arg || {},
            container = options.container || "body",
            domain = options.domain || [0, 1],
            graph = options.graph || {},
            width = options.width,
            height = options.height,
            onselect = options.onselect || function() {};

        var nodes = graph.nodes,
            links = graph.links;

        var maxLinkValue = 0;

        var svg = d3.select(container).append('svg:svg');
        svg.attr("width", width).attr("height", height);

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
            location: 'red',
            people: 'purple',
            time: 'green',
            date: 'green',
            day: 'green',
            datetime: 'green'
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
            .range([5, 50]);

        var linkSize = d3.scalePow()
            .exponent(0.2)
            .domain([1, 3000])
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

        function restart() {

            // Apply the general update pattern to the nodes.
            node = node.data(nodes, function(d) {
                return d.id;
            });
            node.exit().remove();
            node = node.enter()
                .append("circle")
                // .attr("fill", function(d) {
                //     return nodeColor(d.type);
                // })
                .attr("fill", "transparent")
                .attr("r", (d)=>nodeSize(d.value))
                .merge(node)
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
            simulation.alphaTarget(0.1).restart();



        }

        function addNode(n) {

            var n = n || {},
                pos = d3.mouse(this) || [100, 100],
                id = n.id ;

            var newNode = n || {
                x: pos[0],
                y: pos[1],
                value: 10,
                group: 2,
                id: id
            };
            nodes.push(newNode);
            restart();
        }

        function append(subgraph) {
            var sg = subgraph ||  {},
                sn = sg.nodes;

            var pos = sn.pos || [100, 100],
                id = sn.id || nodes.length;

            var newNode = {
                x: pos[0],
                y: pos[1],
                value: sn.value || 10,
                type: sn.type || 'event',
                id: id
            };
            nodeHash[id] = newNode;
            nodes.push(newNode);
            sg.links.forEach(function(sl){
                links.push({
                    source: nodes.filter(function(d) {return d.id === sl.user})[0],
                    target: newNode,
                    value: sl.count,
                })
            })
            // links = links.concat([sl]);
            restart();
        }

        function update(subgraph) {
            var sg = subgraph ||  {},
                sn = sg.nodes;

            var pos = sn.pos || [100, 100],
                id = sn.id || nodes.length;

            var newNode = {
                x: pos[0],
                y: pos[1],
                value: sn.value || 10,
                type: sn.type || 'event',
                id: id
            };
            nodes.push(newNode);
            console.log(id);
            nodeHash[id] = newNode;
            var newLinks = sg.links.map(function(sl){
                return {
                    source: nodeHash[sl.source],
                    target: nodeHash[sl.target],
                    value: sl.value,
                }
            })
            // console.log(newLinks);
            links = newLinks;
            restart();
        }

        function remake(graph) {
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
        }


        // svg.on('dblclick', addNode);

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

            // links.data(links, function(d){
            //     console.log(d.target.x );
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

        function addLabel(d) {
            if (!nodeLabels.hasOwnProperty(d.id)) {
                var label = (d.type=='people') ? 'P ' + d.id : d.id;
                nodeLabels[d.id] = nodeInfo.append("text")
                    .attr("dx", 20)
                    .attr("dy", ".35em")

                    //   .attr("text-anchor", "end")
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
                    .attr("d", logos[d.type])
                    .attr("fill", nodeColor(d))
            }

        }

        // function addLinkCursor(d) {
        //
        //     if(!linkCursors.hasOwnProperty(d.id){
        //         var d.target.
        //         linkInfo.append("polygon")
        //     })
        // }

        function updateIcon(d) {
            nodeIcons[d.id]
            .attr("transform", "translate(" + (d.x-20) + "," + (d.y-20) + ")")

        }

        function getNodes() { return nodes;}
        function getLinks() { return links;}

        return {
            addNode: addNode,
            getNodes: getNodes,
            getLinks: getLinks,
            append: append,
            update: update,
            remake: remake
        }
    }
})
