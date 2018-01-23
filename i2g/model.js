define(function(require) {
    return function(arg) {
        'use strict';
        var model = {};

        var options = arg || {},
            simulate = options.simulate || options.change || function() {},
            onNodeAdded  = options.onNodeAdded || function() {},
            onNodeModified  = options.onNodeModified || function() {},
            data = options.data || {nodes: [], links: []},
            tag = options.tag || '';

        var nodeCounter = 0,
            nodes = data.nodes,
            links = data.links,
            nodeHash = {}; // hash table for storing nodes based on node names


        /** This is a function for adding a new node. */
        model.addNodes = function(newNodes) {
            var newNodes = (Array.isArray(newNodes)) ? newNodes : [newNodes];
            newNodes.forEach(function(newNode){
                var pos = newNode.pos || [0, 0];
                if(!newNode.hasOwnProperty('id'))
                    newNode.id = nodeCounter++;
                if(!newNode.hasOwnProperty('datalink'))
                    newNode.datalink = false;
                newNode.tag = newNode.label;
                newNode.x = pos[0];
                newNode.y = pos[1];
                if(tag !== null)
                    newNode.id = tag + newNode.id;
                nodeHash[newNode.id] = newNode;

                onNodeAdded(newNode);


            });
            return model;
        }

        /** This is a function for adding a new link. */
        model.addLinks = function(newLinks){
            var newLinks = (Array.isArray(newLinks)) ? newLinks : [newLinks];
            newLinks.forEach(function(li){
                li.id = links.length;
                if(typeof li.source !== 'object') {
                    var sourceId = (tag===null) ? li.source : tag + li.source;
                    li.source = nodeHash[sourceId];
                }
                if(typeof li.target !== 'object') {
                    var targetId = (tag===null) ? li.target : tag + li.target;
                    li.target = nodeHash[targetId];
                }

                if(!li.hasOwnProperty('datalink')) li.datalink = false;
                links.push(li);
            });

            return model;
        };

        /** This is a function for modifying a node. */
        model.modifyNode = function(d, props) {
            var theNode = (typeof d == 'object') ? d : nodeHash[d];

            for(var p in props) {
                theNode[p] = props[p];
            }

            if(props.hasOwnProperty('label')) {
                onNodeModified(theNode);
            }
        }

        /** This is a sub function for removing a node. */
        function removeNode(nodeId) {
            nodeIcons[nodeId]._icon.remove();
            nodeIcons[nodeId].remove();
            nodeLabels[nodeId].remove();
            delete nodeIcons[nodeId];
            delete nodeLabels[nodeId];
            delete nodeHash[nodeId];
            nodes = nodes.filter(function(d){
                d.id != nodeId;
            });
        }

        /** This is a sub function for removing a link. */
        function removeLink(linkId) {
            var removedLink = links.splice(linkId,1)[0];
            if(removeLink.hasOwnProperty('icon'))
            removedLink.icon.remove();
        }

        /** This is a function for removing a list of nodes. */
        model.removeNodes = function(query) {
            var nodeIds,
                query = query ||  {};

            if(query.all) {
                nodes.forEach(function(n) {
                    removeNode(n.id);
                })
            } else {
                if(query.id) {
                    nodeIds = query.id;
                } else if(query.type) {
                    nodeIds = nodes.filter(function(n){
                        return n.type !== query.type;
                    })
                    .map(function(n){ return n.id });
                } else if(query.datalink) {
                    nodeIds = nodes.filter(function(n){
                        return n.datalink !== query.datalink;
                    })
                    .map(function(n){ return n.id });
                }

                nodeIds.forEach(function(nid){
                    removeNode(nid);
                });
            }
            return model;
        }

        model.removeLinks = function(query) {
            var linkIds,
                query = query ||  {};

            if(query.all) {
                links = [];
            } else {
                if(query.id) {
                    linkIds = query.id;
                } else if(query.type) {
                    linkIds = links.filter(function(li){
                        return li.type !== query.type;
                    })
                    .map(function(n){ return li.id });
                } else if(query.datalink) {
                    linkIds = links.filter(function(li){
                        return li.datalink !== query.datalink;
                    })
                    .map(function(li){ return li.id });
                }
                linkIds.forEach(function(lid){
                    removeLink(lid);
                });
            }

            return model;
        }

        model.update = function(subgraph) {
            var subgraph = subgraph || {nodes: null, links: null},
                newNodes = subgraph.nodes || [],
                newLinks = subgraph.links || [];

            if(newNodes.length) model.addNodes(newNodes);
            if(newLinks.length) model.addLinks(newLinks);

            simulate();
            return model;
        };

        model.append = function(subgraph) {
            model.addNodes(subgraph.nodes);
            model.addLinks(subgraph.links);
            simulate();
            return model;
        }

        model.remake = function() {
            // nodes = graph.nodes;
            // nodeHash = {};

            graph.nodes.forEach(function(n){
                n.fx = null;
                n.fy = null;
            })
            model.addNodes(graph.nodes);
            simulate();

            var newLinks = graph.links.map(function(sl){
                return {
                    source: nodeHash[sl.source.id],
                    target: nodeHash[sl.target.id],
                    value: sl.value,
                };
            });
            model.addLinks(newLinks);

            simulate();
            return model;
        }

        model.getNodes = function(query) {
            if(typeof query === 'undefined')
                return nodes;
            else {
                return [];
            }
        };

        model.findNode = function(query) {
            return model.getNodes(query)[0];
        }

        model.getLinks = function() { return links; };

        model.nodeHash = nodeHash;
        model.nodes = nodes;
        model.links = links;


        return model;
    }
});
