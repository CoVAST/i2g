
define(function(require){
    "use strict";
    var svg = require("i2v/svg-proto"),
        Axis = require('i2v/svg/axis'),
        Viz = require('i2v/viz'),
        format = require('i2v/format'),
        stats = require('p4/dataopt/stats'),
        arrays = require('p4/core/arrays'),
        scale = require('i2v/metric'),
        Colors = require('i2v/colors');

    return Viz.extend(function ScatterPlot(option){
        var plot = this.$svg(),
            vmap = option.vmap,
            title = option.title,
            colors = option.colors || ["blue"],
            align = option.align || 'left',
            colorDomain = option.colorDomain || [],
            alpha = option.alpha || 0.7,
            axisOptions = option.axis || false,
            onSelect = option.onselect || function() {},
            domainX = option.domainX || false,
            formatX = option.formatX || format(".3s"),
            formatY = option.formatY || format(".3s"),
            scaleX = options.scaleX || 'ordinal',
            scatter = plot.append("g");


        var that = this,
            height = this.$height,
            width = this.$width;

        var yDomains = arrays.unique(this.data.map(function(d){ return d[vmap.y]})).sort(function(a,b){ return a - b;});

        var xAxisOptions = {
            container: plot,
            dim: "x",
            scale: scaleX,
            align: "bottom",
            tickInterval: "fit",
            labelPos: {x: 5, y: -15},
            labelAngel: -35,
            tickPosition: 0,
            format: formatX,
            // grid: 1
        };
        var xDomains;

        if(scaleX == 'linear') {
            xAxisOptions.ticks = 6;
            xDomains = stats(data, [vmap.x]);

        } else {
            xDomains = domainX || arrays.unique(this.data.map(function(d){ return d[vmap.x]})).sort(function(a, b) { return parseInt(a) - parseInt(b);});
            xAxisOptions.ticks = xDomains.length;
        }
        xAxisOptions.domain = xDomains;
        var yAxisOptions = {
            container: plot,
            dim: "y",
            domain: yDomains,
            scale: 'ordinal',
            // exponent: 0.2,
            align: align,
            ticks: yDomains.length,
            labelPos: {x: -5, y: -4},
            format: function(d) { return 'P' + d},
        };

        if(align == 'right'){
            yAxisOptions.labelPos = {x: 8, y: -4};
            yAxisOptions.tickPosition = 5;
        }

        var size = function() { return option.size|| 5};

        if(vmap.size) {
            var maxRadius,
                sizeDomain = stats.domains(this.data, [vmap.size])[vmap.size];

            if(scale == 'linear') {
                maxRadius = this.$height / yDomains.length / 2;
            } else if (sizeDomain[0] !== sizeDomain[1]) {
                maxRadius = Math.min(
                    this.$width / xDomains.length / 2,
                    this.$height / yDomains.length / 2
                );

            }
            size = scale({
                type: 'linear',
                domain: sizeDomain,
                range: [2, maxRadius]
            });

        }

        if(axisOptions.hasOwnProperty('x')) {
            for (var prop in axisOptions.x) {
                xAxisOptions[prop] = axisOptions.x[prop];
            };
        }

        if(axisOptions.hasOwnProperty('y')) {
            for (var prop in axisOptions.y) {
                yAxisOptions[prop] = axisOptions.y[prop];
            };
        }

        var x = Axis(xAxisOptions), y = Axis(yAxisOptions);
        var color, marks = [];

        if(typeof(option.colors) == "function") color = option.colors;
        else color = Colors(option.colors);
        if(option.color) color = function() { return option.color; };

        this.data.forEach(function(d, i){
            var mark = scatter.append("circle")
                .Attr({
                    cx: x(d[vmap.x]),
                    cy: height - y(d[vmap.y]),
                    r: size(d[vmap.size]),
                    "fill-opacity": alpha,
                    fill: color(d[vmap.color])
                    // fill: "none",
                    // "stroke-opacity": alpha,
                    // stroke: color(d[vmap.color])
                });

            marks.push(mark);
        });

        this.select = function(feature, selected) {
            var selectedID = [];
            this.data.forEach(function(d, i){
                if(selected.indexOf(d[feature]) > -1)
                    selectedID.push(i);
            });

            marks.forEach(function(mark){
                mark.attr("fill-opacity", 0.1);
            });

            selectedID.forEach(function(si){
                marks[si].attr("fill-opacity", alpha);
            });
        }
        var highlighted = [];
        this.highlight = function(feature, selected, color) {
            var hColor = color || 'yellow';

            selected.forEach(function(si, ii){
                // console.log(x(that.data[si][vmap.x]));
                highlighted[ii] = scatter.append("circle")
                    .Attr({
                        cx: x(that.data[si][vmap.x]),
                        cy: y(that.data[si][vmap.y]),
                        r: size,
                        fill: hColor
                    });
            });
        }

        this.unhighlight = function() {
            highlighted.forEach(function(hi){
                hi.remove();
            });
            highlighted = [];
        }

        this.selectRange = function(feature, range) {
            var min = Math.min(range[0], range[1]),
                max = Math.max(range[0], range[1]);
            this.data.forEach(function(d,i){
                if(d[feature] <= min || d[feature] >= max)
                    marks[i].attr("fill", "none");
                else
                    marks[i].attr("fill", color(d[vmap.color]));
            });
        }
        var xSelector = plot.append('g')
            .append('rect')
            .attr('width', this.$width)
            .attr('height', this.$padding.bottom)
            .attr('x', this.$padding.left)
            .attr('y', this.$height + this.$padding.top)
            .attr('fill', 'transparent')



        scatter.translate(this.$padding.left, this.$padding.top);
        var padding = this.$padding;

        var selected = new Array(xDomains.length).fill(false),
            selectBox = new Array(xDomains.length);
        xSelector.svg.ondblclick  = function(e) {

            var xi = x.invert(e.offsetX - padding.left - width/xDomains.length *.5) ,
                dataId = xDomains.indexOf(xi);

            if(!selected[dataId]) {
                selectBox[dataId] = scatter.append('rect')
                    .attr("x", width / xDomains.length * dataId)
                    .attr("y", 0)
                    .attr("width", width / xDomains.length)
                    .attr("height",height)
                    .style("fill", 'none')
                    .style("stroke", 'green')

                selected[dataId] = true;
                // console.log(dataId, xDomains[dataId]);
                onSelect(xDomains[dataId]);
            } else {

                selectBox[dataId].remove();

                selected[dataId] = false;
            }


        }

        var legend = plot.append("g");

        if(yAxisOptions.label) {
            var yAxisPosition = (yAxisOptions.align == 'left') ? 0 : (this.$width + this.$padding.left + this.$padding.right/2 + 5),
                axisTitle = (typeof yAxisOptions.label == 'string') ? yAxisOptions.label : vmap.y.split("_").join(" ");
            legend.append("g")
              .append("text")
                .attr("class", "i2v-axis-title")
                .attr("transform", "rotate(-90)")
                .attr("y", yAxisPosition)
                .attr("x", -this.$height/2 - this.$padding.top)
                .attr("dy", ".85em")
                .style('font-size', '1.5em')
                .style("text-anchor", "middle")
                .style(" text-transform", "capitalize")
                .text(axisTitle);
        }


        if(xAxisOptions.label) {
            var xAxisPosition = (xAxisOptions.align == 'top') ? 0 : (this.$height + this.$padding.bottom /2 + this.$padding.top),
                axisTitle = (typeof xAxisOptions.label == 'string') ? xAxisOptions.label : vmap.x.split("_").join(" ");
            legend.append("g")
              .append("text")
                // .attr("transform", "rotate(-90)")
                .attr("class", "i2v-axis-title")
                .attr("y", xAxisPosition)
                .attr("x", this.$width/2 + this.$padding.left)
                .attr("dy", ".85em")
                .style('font-size', '1.2em')
                .style("text-anchor", "middle")
                .style(" text-transform", "capitalize")
                .text(axisTitle);
            }

        if(option.title) {
            legend.append("g")
              .append("text")
                .attr("class", "i2v-chart-title")
                .attr("y", this.$padding.top / 2)
                .attr("x", this.$padding.left + this.$width/2 )
                .attr("dy", "1em")
                .css("text-anchor", "middle")
                .text(option.title);
        }
        if(colorDomain) {

            colorDomain.forEach(function(d, i){
                var cdLegendWidth = that.$width / colorDomain.length;
                scatter.append("circle")
                    .Attr({
                        cx: that.$padding.right + i * cdLegendWidth ,
                        cy: -size*2 ,
                        r: size,
                        // fill: "none",
                        fill:  colors[i],

                    });
                scatter.append("text")
                    .attr("class", "i2v-legend-label")
                    .attr("x", that.$padding.right + i*cdLegendWidth + 10)
                    .attr("y", -size)
                    .css("fill", "#222")
                    .text(d);
            })
        }

        this.svg.push(plot);
        this.viz();
    });
});
