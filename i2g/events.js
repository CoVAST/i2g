define(function(require) {
    const tooltipOffset = 5;
    const widget = require('./utils/widget');
    return function(arg) {
        var events = {};
        var tooltipHash = {};
        var dblclickedHash = {};
        var indicatorColor = d3.scaleOrdinal(d3.schemeCategory20);

        events.node =  {
            mouseover: function(d, evt) {
                var view = this;
                if(dblclickedHash[d.id] == null) {
                    if(!tooltipHash.hasOwnProperty(d.id)) {
                        var nodeTooltip = widget({
                            category: 'tooltip',
                            label: d.label,
                            provenance: d.provenance,
                            color: indicatorColor(parseInt(d.id)),
                            callback: function() {
                                tooltipHash[d.id].removeWidget();
                                delete tooltipHash[d.id];
                                delete dblclickedHash[d.id];
                                if(dblclickedHash[d.id]) {
                                    view.markNode(d.id, indicatorColor(parseInt(d.id)));
                                } else {
                                    view.unmarkNode(d.id);
                                }
                            }
                        });
                        tooltipHash[d.id] = nodeTooltip;
                    }
                    var top = evt.pageY + tooltipOffset;
                    var left = evt.pageX + tooltipOffset;
                    tooltipHash[d.id].changePosition(top, left);
                }
            },

            mousemove: function(d, evt) {
                if(dblclickedHash[d.id] == null) {
                    var top = evt.pageY + tooltipOffset;
                    var left = evt.pageX + tooltipOffset;
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
                var top = evt.pageY + tooltipOffset;
                var left = evt.pageX + tooltipOffset;
                tooltipHash[d.id].changePosition(top, left);
            },

            dblclick: function(d, evt, svgObj) {
                dblclickedHash[d.id] = true;
                tooltipHash[d.id].indicate();
                if(dblclickedHash[d.id]) {
                    this.markNode(d.id, indicatorColor(parseInt(d.id)));
                } else {
                    this.unmarkNode(d.id);
                }
            }
        }

        return events;
    }
})
