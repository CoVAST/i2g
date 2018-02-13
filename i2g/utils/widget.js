/* The standard form of the panel */

define(function(require) {
    var dropdown = require('./dropdown');
    var provenance_panel = require('./panel');

	return function(arg) {
        "use strict";
        var widget = {};

		var option = arg || {},
			container = option.container || "body",
            category = option.category || "",
        	label = option.label || "",
            type = option.type || "",
            size = option.size || 0,
            provenance = option.provenance || [],
            subGraph = option.subGraph || null,
        	width = option.width || 300,
            marginTop = option.marginTop || 0,
            marginLeft = option.marginLeft || 0,
        	color = option.color || "default",
        	callback = option.callback || {};

        var dragging = false;

        var newLabel,
            newType,
            newSize,
            newColor,
            newProvenance = [],
            newSubGraph;

        var widgetContainer;

        if(category == "tooltip") {
            widgetContainer = $('<div class = "widget"/>')
                .appendTo(container);

            var functionRow = $('<div class = "widgetRow"/>')
            	.appendTo(widgetContainer)
            	.css("display", "none");

            var close = $('<div class = "widgetClose"/>')
            	.appendTo(functionRow)
            	.html("\uf057")
            	.click(function() {
            		callback();
            	});

            var labelRow = $('<div class = "widgetRow"/>')
            	.appendTo(widgetContainer);

            var labelText = $('<div class = "widgetLabelText"/>')
            	.appendTo(labelRow)
            	.html(label);

            provenance.forEach((d) => {
                var vis = d.vis,
                    annotation = d.annotation;


                var separateLine = $('<div class = "separeateLine"/>')
                    .appendTo(widgetContainer);

                if(vis != "") {
                    var visImgBox = $('<div class="widgetImgBox"/>')
                        .appendTo(widgetContainer);

                    //var bigImgBox;
                    var bigContainer = $('#PadModal');

                    var visImg = $('<img draggable = "false">')
                        .appendTo(visImgBox)
                        .click((e) => {
                            bigContainer.show();
                            // bigImgBox = $('<div class="bigImgBox"/>')
                            //     .appendTo(bigContainer);
                            var bigImg = $('<img class="bigImg" draggable = "false">')
                                .appendTo(bigContainer);
                            bigImg[0].src = vis;

                            $(window).click(removeBigImg);

                            function removeBigImg() {
                                if(this.event.target == bigContainer[0]) {
                                    bigContainer.empty();
                                    bigContainer.hide();
                                    $(window).off("click", removeBigImg);
                                }
                            }
                        });

                    visImg[0].src = vis;

                }

                if(annotation != "") {
                    var annotationRow = $('<div class = "widgetRow" style = "margin-top: 5px;"/>')
                        .appendTo(widgetContainer);

                    var annotationText = $('<div class = "widgetAnnotationText"/>')
                        .appendTo(annotationRow)
                        .html(annotation);
                }
            })



            widget.changePosition = function(margin_top, margin_left) {
            	marginTop = margin_top;
            	marginLeft = margin_left;
            	widgetContainer.css("margin-top", margin_top);
            	widgetContainer.css("margin-left", margin_left);
            	return widget;
            }

            widget.indicate = function() {
            	functionRow.show();
            	widgetContainer.css("border", "3px solid " + color);
            }

        } else {
            widgetContainer = $('<div class = "PadModal-container"/>')
                .appendTo(container);

            widgetContainer.width(width);
            widgetContainer.css('margin-top', marginTop);
            widgetContainer.css('margin-left', marginLeft);

            var titleText = $('<h1/>')
                .appendTo(widgetContainer)
                .text(function() {
                    if(category == "nodePanel") {
                        return "Node Properties";
                    } else if(category == "linkPanel") {
                        return "Link Properties";
                    }
                });

            var padForm = $('<div/>')
                .appendTo(widgetContainer);

            var labelText = $('<div class = "PadText">Label:</div>')
                .appendTo(padForm);
            var labelInput = $('<input type = "text">')
                .appendTo(padForm)
                .val(label);

            if(category == "nodePanel") {
                var typeText = $('<div class = "PadText">Type:</div>')
                    .appendTo(padForm);
                var padType = $('<div class = "PadDropdown"/>')
                    .appendTo(padForm);

                var typeChange = function(dropdownText) {
                    newType = dropdownText;
                }

                dropdown({
                    container: padType,
                    category: "type",
                    defaultVal: type,
                    list: [
                        "location",
                        "people",
                        "time",
                        "unknown",
                        "default"
                        ],
                    callback: typeChange
                })
            }



            var sizeText = $('<div class = "PadText">Size:</div>')
                .appendTo(padForm);
            var padSize = $('<div class = "PadDropdown"/>')
                .appendTo(padForm);

            var sizeChange = function(dropdownText) {
                newSize = dropdownText;
            }

            dropdown({
                container: padSize,
                category: "size",
                defaultVal: size,
                list: [
                    1,
                    2,
                    3,
                    4
                    ],
                callback: sizeChange
            })

            var colorText = $('<div class = "PadText">Color:</div>')
                .appendTo(padForm);
            var padColor = $('<div class = "PadDropdown"/>')
                .appendTo(padForm);

            var colorChange = function(dropdownText) {
                newColor = dropdownText;
            }

            dropdown({
                container: padColor,
                category: "color",
                defaultVal: color,
                list: [
                    "red",
                    "orange",
                    "yellow",
                    "green",
                    "indigo",
                    "blue",
                    "purple",
                    "grey"
                    ],
                callback: colorChange
            })

            /*
            var nodePadSubGraph = $('<div class = "PadSubGraphBox"/>')
                .appendTo(padForm);
            var nodePadSubGraphUploadText = $('<div>Please input a json file</div>')
                .appendTo(nodePadSubGraph);
            var nodePadSubGraphUploadFile = $('<input type = "file" multiple size = "50"><br>')
                .appendTo(nodePadSubGraph);
            var nodePadSubGraphRemoveFile = $('<input type = "button" value = "Remove sub graph">')
                .appendTo(nodePadSubGraph);
            var nodePadSubGraphUploadFileDemo = $('<div class = "PadSubGraphDemo"/>')
                .appendTo(nodePadSubGraph);
            */

            var countProvenance = provenance.length;
            var provenanceHash = {};

            var provenanceText = $('<div class = "PadText">Provenance:</div>')
                .appendTo(padForm);
            var padProvenanceBox = $('<div class = "padProvenanceBox"/>')
                .appendTo(padForm);
            var padProvenance = $('<div/>')
                .appendTo(padProvenanceBox);
            var addNewProvenance = $('<div class = "addNewProvenance">+</div>')
                .appendTo(padProvenanceBox);

            provenance.forEach((d, i) => {
                var newProvenanceElement = $('<div class = "newProvenanceElement"/>')
                    .appendTo(padProvenance);
                provenanceHash[i] = provenance_panel({
                    container: newProvenanceElement,
                    vis: d.vis,
                    annotation: d.annotation,
                    width: width - 10
                })
            })

            addNewProvenance.click(function() {
                var newProvenanceElement = $('<div class = "newProvenanceElement"/>')
                    .appendTo(padProvenance);
                provenanceHash[countProvenance++] = provenance_panel({
                    container: newProvenanceElement,
                    width: width - 10
                })
                padProvenanceBox.animate({
                    scrollTop: padProvenance.height()
                })
            })




            var saveSubmitButton = $('<button type = "button" class = "btn btn-success">Save Change</button>')
                .appendTo(padForm);

            saveSubmitButton.click(function() {
                saveStatus();
            })

            // Preview the sub graph
            /*
            if(nodeSubGraph != null) {
                nodePadSubGraphUploadFileDemo.html("Node: " + nodeSubGraph.nodes.length + ", Link: " + nodeSubGraph.links.length);
            }

            nodePadSubGraphUploadFile.on('change', function() {
                var x = nodePadSubGraphUploadFile[0].files[0];
                var reader = new FileReader();
                reader.onload = function() {
                    var graphData = JSON.parse(reader.result);
                    nodeSubGraph = {
                        nodes: graphData.nodes,
                        links: graphData.links
                    };
                    nodePadSubGraphUploadFileDemo.html("Node: " + nodeSubGraph.nodes.length + ", Link: " + nodeSubGraph.links.length);
                };
                reader.readAsText(x);
            });

            nodePadSubGraphRemoveFile.on('click', function() {
                nodePadSubGraphUploadFileDemo.empty();
                nodeSubGraph = null;
            });
            */


            container.show();

            $(window).click(removePanel);

            function removePanel() {
                if(this.event.target == container[0]) {
                    saveStatus();
                }
            };

            function saveStatus() {
                newLabel = labelInput.val();
                newSubGraph = subGraph;
                Object.keys(provenanceHash).forEach((d) => {
                    var newElement = provenanceHash[d].save();
                    if(newElement != null) {
                        newProvenance.push(newElement);
                    }
                })
                container.empty();
                container.hide();
                $(window).off("mousemove", dragmove);
                $(window).off("mouseup", dragend);
                $(window).off("click", removePanel);
                if(category == "nodePanel") {
                    callback(newLabel, newType, newSize, newColor, newProvenance, newSubGraph);
                } else if(category == "linkPanel") {
                    callback(newLabel, newSize, newColor, newProvenance);
                }
            }
        }

        widgetContainer.mousedown((e) => {
        	dragging = true;
        })

        $(window).mousemove(dragmove);

        function dragmove() {
            if(dragging) {
                var dy = this.event.movementY;
                var dx = this.event.movementX;
                drag(dy, dx);
            }
        }

        function drag(dy, dx) {
            marginTop += dy;
            marginLeft += dx;
            widgetContainer.css("margin-top", marginTop);
            widgetContainer.css("margin-left", marginLeft);
        }



        $(window).mouseup(dragend);

        function dragend() {
            dragging = false;
        }



        widget.removeWidget = function() {
            widgetContainer.remove();
            $(window).off("mousemove", dragmove);
            $(window).off("mouseup", dragend);
        }


        return widget;
	}
})
