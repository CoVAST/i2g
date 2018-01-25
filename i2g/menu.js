define(function(require) {
    var nodePad = require('./ui/nodePad'),
        download = require('./downloadFunc');

    /** Set up a group of context menu functions. */
    function svgMenu(i2g) {
        var uploadFile;
        $.contextMenu.types.label = function(item, opt, root) {
            // this === item.$node
            /*
            <div>Please input a file<div>
            <input type="file" id="myFile" multiple size="50">
            <div id="demo"></div>
            */
            var uploadText = $('<div>Please input a file<div>').appendTo(this);
            uploadFile = $('<input type="file" multiple size="50">').appendTo(this);
            var uploadFileDemo = $('<div/>').appendTo(this);
            uploadFile.on('change', function() {
                var x = uploadFile[0];
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
                uploadFileDemo.html(txt);
            });
        };


        $.contextMenu({
            selector: i2g.container,
            callback: function(key, options) {
                var newNodeType;
                var newNodePosition = $(".context-menu-root:eq(0)").position();
                if(key == 'uploadFile') {
                    var x = uploadFile[0].files[0];
                    var reader = new FileReader();
                    reader.onload = function(){
                        var graphData = JSON.parse(reader.result);

                        i2g.model
                            .removeNodes({all: true});
                        i2g.update();
                        i2g.model.addNodes(graphData.nodes);
                        i2g.update();

                        graphData.links.forEach((d) => {
                            i2g.model.addLinks({
					            source: d.source.id,
					            target: d.target.id,
					            value: d.value
					        });
                        });

                        i2g.update();
                    };
                    reader.readAsText(x);
                } else if(key == 'saveFile') {
                    var graphData = ({
                        nodes: i2g.model.getNodes(),
                        links: i2g.model.getLinks()
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
                    i2g.model.addNodes({
                        label: 'New ' + key,
                        type: newNodeType,
                        x: newNodePosition.left,
                        y: newNodePosition.top,
                        value: 0,
                        datalink: false
                    });
                    i2g.update();
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

    function nodeMenu(i2g) {
        $.contextMenu({
            selector: '.nodeHolder',
            callback: function(key, options) {
                var thisNode = this[0],
                    thisNodeId = thisNode.__data__.id,
                    thisNodePosition = $(".context-menu-root:eq(1)").position();

                if(key == 'removeNode') {
                    i2g.model.removeNode(thisNodeId);
                    i2g.update();
                } else if(key == 'modifyNode') {
                    i2g.updateNode(thisNode, {stroke: 'orange'});
                    var saveChanges = function(newLabelText, newLabelType) {
                        i2g.updateNode(thisNode, {stroke: 'transparent'});
                        var changes = {
                            label: newLabelText,
                            type: newLabelType
                        }
                        i2g.model.modifyNode(thisNodeId, changes);
                        i2g.update();
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
                    i2g.startAddingLink(thisNodeId);
                }
            },
            items: {
                removeNode: {name: "Remove this node", icon: "fa-times"},
                addLink: {name: "Add link", icon: "fa-long-arrow-right"},
                modifyNode: {name: "Modify node", icon: "fa-commenting"},
            }
        });
    }

    function linkMenu(i2g) {
        $.contextMenu({
            selector: '.graphLinks',
            callback: function(key, options) {
                var thisLink = this[0],
                    thisLinkId = thisLink.__data__.id;
                if(key == 'removeLink') {
                    i2g.model.removeLink(thisLinkId);
                    i2g.update();
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
