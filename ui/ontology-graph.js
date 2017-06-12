define(function() {
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

        var svg = d3.select(container).append('svg:svg');
        svg.attr("width", width).attr("height", height);

        var nodeColor = d3.scaleOrdinal(d3.schemeCategory10);

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
            .alphaTarget(0.3)
            .stop()
        //
        ;

        var g = svg.append("g"),
            link = g.append("g").attr("stroke", "#BBB").selectAll(".link"),
            node = g.append("g").attr("stroke", "#fff").selectAll(".node");


        var gLabel = g.append("g"),
            nodeLabels = {};
        restart();

        function restart() {

            // Apply the general update pattern to the nodes.
            node = node.data(nodes, function(d) {
                return d.id;
            });
            node.exit().remove();
            node = node.enter()
                .append("circle")
                .attr("fill", function(d) {
                    return nodeColor(d.type);
                })
                .attr("r", (d)=>nodeSize(d.value))
                .merge(node)
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended))

            // console.log(node);
            node.data(nodes, label);

            // Apply the general update pattern to the links.
            link = link.data(links, function(d) {
                return d.source.id + "-" + d.target.id;
            });
            link.exit().remove();
            link = link.enter()
                .append("line")
                .attr("stroke-width", (d)=>linkSize(d.value))
                .merge(link);

            link.append('title')
                .text((d)=>(d.value))

            // Update and restart the simulation.
            simulation.nodes(nodes);
            simulation.force("link").links(links);
            simulation.alphaTarget(0.3).restart();

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

        svg.on('dblclick', addNode);

        function ticked() {
            node.attr("cx", function(d) {return d.x;})
                .attr("cy", function(d) {return d.y;})

            link.attr("x1", function(d) {return d.source.x;})
                .attr("y1", function(d) {return d.source.y;})
                .attr("x2", function(d) {return d.target.x;})
                .attr("y2", function(d) {return d.target.y;});

            node.data(nodes, updateLabel);
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

        function label(d) {
            if (!nodeLabels.hasOwnProperty(d.id)) {
                var label = (d.type=='people') ? 'P ' + d.id : d.id;
                nodeLabels[d.id] = gLabel.append("text")
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

        return {
            addNode: addNode,
            nodes: nodes,
            links: links,
            append: append
        }
    }
})
