define(function(require) {
    var logos = require("./icons"),
        model = require("./model"),
        view = require('./view'),
        menu = require("./menu"),
        widget = require("./ui/widget");

    return function(arg) {
        "use strict";
        var i2g = {};
        // get all the setting from input
        var options = arg || {},
            container = options.container || "body",
            graph = options.graph || options.data || {},
            width = options.width || 600,
            height = options.height || 600,
            graphId = options.graphId || "igraph-svg",
            graphName = options.graphName || "",
            scale = options.scale || 1,
            colorScheme = options.colorScheme;

        var tooltipHash = {};
        var dblclickedHash = {};

        i2g.model = model({
            data: graph,
            tag: graphName
        });

        options.model = i2g.model;
        i2g.view = view(options);
        i2g.menu = menu(i2g.view);

        var indicatorColor = d3.scaleOrdinal(d3.schemeCategory20);

        i2g.view.nodeEvents = {
            mouseover: function(d, evt) {
                if(dblclickedHash[d.id] == null) {
                    var nodeSVGObject = $(this).find('.nodeHolder')[0];
                    if(!tooltipHash.hasOwnProperty(d.id)) {
                        var nodeTooltip = widget({
                            category: "tooltip",
                            label: d.label,
                            provenance: d.provenance,
                            color: indicatorColor(parseInt(d.id)),
                            callback: function() {
                                tooltipHash[d.id].removeWidget();
                                delete tooltipHash[d.id];
                                delete dblclickedHash[d.id];
                                if(dblclickedHash[d.id]) {
                                    i2g.view.markNode(nodeSVGObject, indicatorColor(parseInt(d.id)));
                                } else {
                                    i2g.view.unmarkNode(nodeSVGObject);
                                }
                            }
                        });
                        tooltipHash[d.id] = nodeTooltip;
                    }
                    var top = evt.pageY + 5;
                    var left = evt.pageX + 5;
                    tooltipHash[d.id].changePosition(top, left);
                }
            },

            mousemove: function(d, evt) {
                if(dblclickedHash[d.id] == null) {
                    var top = evt.pageY + 5;
                    var left = evt.pageX + 5;
                    tooltipHash[d.id].changePosition(top, left);
                }
            },

            mouseleave: function(d, evt) {
                if(dblclickedHash[d.id] == null) {

                    tooltipHash[d.id].removeWidget();
                    delete tooltipHash[d.id];
                }
            },

            mouseup: function(d, evt) {
                var top = evt.pageY + 5;
                var left = evt.pageX + 5;
                tooltipHash[d.id].changePosition(top, left);
            },

            dblclick: function(d) {
                var nodeSVGObject = $(this).find('.nodeHolder')[0];
                dblclickedHash[d.id] = true;
                tooltipHash[d.id].indicate();

                if(dblclickedHash[d.id]) {
                    i2g.view.markNode(nodeSVGObject, indicatorColor(parseInt(d.id)));
                } else {
                    i2g.view.unmarkNode(nodeSVGObject);
                }

            }
        }

        return i2g;
    }
})
