define(function(require) {
    var nodePad = require('./ui/nodePad'),
        download = require('./downloadFunc');

    /** Set up a group of context menu functions. */
    function svgMenu(container, i2g) {
        $.contextMenu.types.label = function(item, opt, root) {
            // this === item.$node
            $('<div>Please input a file<div>\
                <input type="file" id="myFile" multiple size="50">\
                <div id="demo"></div>')
                .appendTo(this)
                .on('change', function() {
                    var x = document.getElementById("myFile");
                    var txt = "";
                    if ('files' in x) {
                        if (x.files.length == 0) {
                            txt = "Select one or more files.";
                        } else {
                            for (var i = 0; i < x.files.length; i++) {
                                txt += "<br><strong>" + (i+1) + ". file</strong><br>";
                                var file = x.files[i];
                                if ('name' in file) {
                                    txt += "name: " + file.name + "<br>";
                                }
                                if ('size' in file) {
                                    txt += "size: " + file.size + " bytes <br>";
                                }
                            }
                        }
                    }
                    else {
                        if (x.value == "") {
                            txt += "Select one or more files.";
                        } else {
                            txt += "The files property is not supported by your browser!";
                            txt  += "<br>The path of the selected file: " + x.value; // If the browser does not support the files property, it will return the path of the selected file instead.
                        }
                    }
                    document.getElementById("demo").innerHTML = txt;
                });
        };


        $.contextMenu({
            selector: container,
            callback: function(key, options) {
                var newNodeType;
                var newNodePosition = $(".context-menu-root:eq(0)").position();
                if(key == 'uploadFile') {
                    var x = document.getElementById("myFile").files[0];
                    var reader = new FileReader();
                    reader.onload = function(){
                        var graphData = JSON.parse(reader.result);
                        i2g.nodes.forEach((d) => {
                            d3.select(d).remove();
                            i2g.removeNode(d.id);
                            i2g.update();
                        });
                       	nodeCounter = 0;
                        var uploadNodes = graphData.nodes;
                        uploadNodes.forEach((d) => {
                            i2g.addNodes({
					            label: d.label,
					            type: d.type,
					            fx: d.fx,
					            fy: d.fy,
					            value: d.value,
					            datalink: d.datalink
					        }).update();
                        });
                        var uploadLinks = graphData.links;
                        uploadLinks.forEach((d) => {
                            i2g.addLinks({
					            source: d.source.id,
					            target: d.target.id,
					            value: d.value
					        }).update();
                        });
                    };
                    reader.readAsText(x);
                } else if(key == 'saveFile') {
                    var graphData = ({
                        nodes: i2g.nodes,
                        links: i2g.links
                    });
                    var fileName = options.inputs["downloadFileName"].$input.val();
                    download(graphData, fileName);
                } else {
                    if(key == 'location') {
                        newNodeType = 'location';
                    } else if(key == 'people') {
                        newNodeType = 'people';
                    } else if(key == 'time') {
                        newNodeType = 'time';
                    }
                    i2g.addNodes({
                        label: 'New ' + key,
                        type: newNodeType,
                        fx: newNodePosition.left,
                        fy: newNodePosition.top,
                        value: 0,
                        datalink: false
                    }).update();
                }
            },
            items: {
                addNode: {
                    name: "Add node",
                    icon: "fa-plus-square",
                    items: {
                        location: {
                            name: "Location",
                            icon: "fa-map-marker"
                        },
                        people: {
                            name: "People",
                            icon: "fa-user"
                        },
                        time: {
                            name: "Time",
                            icon: "fa-clock-o"
                        }
                    }
                },
                importGraph: {
                    name: "Import graph",
                    icon: "fa-upload",
                    items: {
                        uploadFileName: {
                            name: "Please input a file",
                            type: 'label',
                            callback: function(){ return false; }
                        },
                        sep1: "---------",
                        uploadFile: {
                            name: "upload file",
                            icon: "fa-folder-open"
                        }
                    }
                },
                exportGraph: {
                    name: "Export graph",
                    icon: "fa-download",
                    items: {
                        downloadFileName: {
                            name: "Please input the file name",
                            type: 'text',
                            value: ""
                        },
                        sep1: "---------",
                        saveFile: {
                            name: "Save file",
                            icon: "fa-floppy-o"
                        }
                    }
                },
            }
        });
    }


    function nodeMenu(i2g, tempLink) { //TODO: remove tempLink after separating model and view
        $.contextMenu({
            selector: '.nodeHolder',
            callback: function(key, options) {
                var thisNode = this[0],
                    thisNodeId = thisNode.__data__.id,
                    thisNodePosition = $(".context-menu-root:eq(1)").position();

                if(key == 'removeNode') {
                    d3.select(thisNode).remove();
                    i2g.removeNode(thisNodeId);
                    i2g.update();
                } else if(key == 'modifyNode') {
                    d3.select(thisNode).attr('stroke', 'orange');

                    var saveChanges = function(newLabelText, newLabelType) {
                        d3.select(thisNode).attr('stroke', 'transparent');
                        var changes = {
                            label: newLabelText,
                            type: newLabelType
                        }
                        i2g.modifyNode(thisNodeId, changes);
                    }

                    nodePad({
                        container: $("#nodePadModal"),
                        nodeLabel: thisNode.__data__.label,
                        nodeType: thisNode.__data__.type,
                        width: 300,
                        marginTop: thisNodePosition.top + 10,
                        marginLeft: thisNodePosition.left + 10,
                        callback: saveChanges
                    });

                } else if(key == 'addLink'){
                    tempLink.source = i2g.nodeHash[thisNodeId];

                    tempLink.target = null;
                    tempLink.svg
                        .attr('x1', tempLink.source.x)
                        .attr('y1', tempLink.source.y)
                        .attr('x2', tempLink.source.x)
                        .attr('y2', tempLink.source.y)
                        .attr('stroke-width', 4);
                }
            },
            items: {
                removeNode: {name: "Remove this node", icon: "fa-times"},
                addLink: {name: "Add link", icon: "fa-long-arrow-right"},
                modifyNode: {name: "Modify node", icon: "fa-commenting"},
            }
        });
    }

    function linkMenu() {
        $.contextMenu({
            selector: '.graphLinks',
            callback: function(key, options) {
                var thisLink = this[0],
                    thisLinkId = thisLink.__data__.id;
                if(key == 'removeLink') {
                    d3.select(thisLink).remove();
                    removeLink(thisLinkId);
                } else if(key == 'annotate') {

                }
            },
            items: {
                removeLink: {name: "Remove this link", icon: "fa-times"},
                annotate: {name: "Annotate", icon: "fa-commenting"},
            }
        });
    }


    return {
        svgMenu: svgMenu,
        linkMenu: linkMenu,
        nodeMenu: nodeMenu
    }



})
