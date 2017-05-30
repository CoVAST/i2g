define(function(){
    return function(arg) {
        var options = arg || {},
            container = options.container || "body",
            width = options.width,
            height = options.height,
            data = options.data || {};

        var svg = d3.select(container).append('svg:svg').attr("width", width).attr("height", height),
            margin = {top: 20, right: 20, bottom: 30, left: 50},
            width = width - margin.left - margin.right,
            height = height- margin.top - margin.bottom,
            g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleTime()
            .rangeRound([0, width]);

        var y = d3.scaleLinear()
            .rangeRound([height, 0]);

        var area = d3.area()
            .x(function(d) { return x(d.time); })
            .y1(function(d) { return y(d.count); });

        x.domain(d3.extent(data, function(d) { return d.time; }));
        y.domain([0, d3.max(data, function(d) { return d.count; })]);
        area.y0(y(0));

        g.append("path")
            .datum(data)
            .attr("fill", "teal")
            .attr("d", area);

        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        g.append("g")
            .call(d3.axisLeft(y))
    }
})
