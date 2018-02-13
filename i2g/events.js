define(function(require) {

    return function(arg) {
        var events = {};
        var tooltipHash = {};
        var dblclickedHash = {};
        var indicatorColor = d3.scaleOrdinal(d3.schemeCategory20);

        events.node =  {
            mouseover: function(d, evt) {
                if(dblclickedHash[d.id] == null) {
                    var nodeSVGObject = $(this).find('.nodeHolder')[0];
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
                                    i2g.view.markNode(nodeSVGObject, indicatorColor(parseInt(d.id)));
                                } else {
                                    i2g.view.unmarkNode(nodeSVGObject);
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

            dblclick: function(d) {
                var nodeSVGObject = this.getElementByClassName('.nodeHolder')[0];
                dblclickedHash[d.id] = true;
                tooltipHash[d.id].indicate();

                if(dblclickedHash[d.id]) {
                    i2g.view.markNode(nodeSVGObject, indicatorColor(parseInt(d.id)));
                } else {
                    i2g.view.unmarkNode(nodeSVGObject);
                }

            }
        }

        return events;
    }
})
