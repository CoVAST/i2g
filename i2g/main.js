define(function(require) {
    const logos = require('./icons');
    const model = require('./model');
    const view = require('./view');
    const events = require('./events');
    const colors = require('./colors');
    const menu = require('./menu');
    const widget = require('./utils/widget');
    const tooltipOffset = 5;

    return function(arg) {
        'use strict';
        var i2g = {};
        // get all the setting from input
        var options = arg || {},
            container = options.container || 'body',
            graph = options.graph || options.data || {},
            width = options.width || 600,
            height = options.height || 600,
            graphId = options.graphId || 'igraph-svg',
            graphName = options.graphName || '',
            scale = options.scale || 1;

        i2g.model = model({data: graph, tag: graphName});
        i2g.view = view(
            Object.assign(
                {model: i2g.model, nodeEvents: events.node, colors: colors},
                options
            )
        );
        i2g.menu = menu(i2g.view);

        return i2g;
    }
})
