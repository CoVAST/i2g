if(typeof define == 'function') define(function() { return i2gModel; });

function i2gModel(arg) {
    'use strict';
    var model = {};

    var options = arg || {},
        onNodeAdded  = options.onNodeAdded || function() {},
        onNodeRemoved  = options.onNodeRemoved || function() {},
        onNodeModified  = options.onNodeModified || function() {},
        data = options.data || {nodes: [], links: []},
        tag = options.tag || '';

    var nodeCounter = 0,
        nodes = data.nodes,
        links = data.links,
        nodeHash = {}; // hash table for storing nodes based on node names

    model.removeNode = function(nodeId) {
        nodes = nodes.filter(function(d){
            d.id != nodeId;
        });
        delete nodeHash[nodeId];
        onNodeRemoved(nodeId);
    }

    model.removeLink = function(linkId) {
        var removedLink = links.splice(linkId,1)[0];
        if(removedLink.hasOwnProperty('icon')) {
            removedLink.icon.remove();
        }
    }

    model.addNodes = function(newNodes) {
        var newNodes = (Array.isArray(newNodes)) ? newNodes : [newNodes];
        newNodes.forEach(function(newNode){
            var pos = newNode.pos || [0, 0];
            if(!newNode.hasOwnProperty('id')) {
                newNode.id = nodeCounter;
            }
            nodeCounter++;
            if(!newNode.hasOwnProperty('datalink')) {
                newNode.datalink = false;
            }
            newNode.tag = newNode.label;
            newNode.x = pos[0];
            newNode.y = pos[1];
            if(tag !== null) {
                newNode.id = tag + newNode.id;
            }
            nodeHash[newNode.id] = newNode;
            nodes.push(newNode);
            onNodeAdded(newNode);
        });
        return model;
    }

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

            if(!li.hasOwnProperty('datalink')) { 
                li.datalink = false;
            }
            links.push(li);
        });

        return model;
    };


    model.modifyNode = function(d, props) {
        var theNode = (typeof d == 'object') ? d : nodeHash[d];

        for(var p in props) {
            theNode[p] = props[p];
        }

        if(props.hasOwnProperty('label')) {
            onNodeModified(theNode);
        }
    }

    model.removeNodes = function(query) {
        var nodeIds,
            query = query ||  {};

        if(query.all) {
            nodes.forEach(function(n) {
                model.removeNode(n.id);
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
                model.removeNode(nid);
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

    model.appendGraph = function(subgraph) {
        var subgraph = subgraph || {nodes: null, links: null},
            newNodes = subgraph.nodes || [],
            newLinks = subgraph.links || [];

        if(newNodes.length) model.addNodes(newNodes);
        if(newLinks.length) model.addLinks(newLinks);

        return model;
    };

    model.nodeHash = nodeHash;
    model.nodes = nodes;
    model.links = links;

    return model;
}
