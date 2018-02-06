/* The standard form of the panel */

define(function(require) {
    var dropdown = require('./dropdown');

	return function(arg) {
        "use strict";
        var widget = {};

		var option = arg || {},
			container = option.container || "body",
            category = option.category || "",
        	label = option.label || "",
            type = option.type || "",
            annotation = option.annotation || "",
            subGraph = option.subGraph || null,
            vis = option.vis || "",
        	width = option.width || 300,
            marginTop = option.marginTop || 0,
            marginLeft = option.marginLeft || 0,
        	color = option.color || null,
        	callback = option.callback || {}; 

        var dragging = false;

        var newLabel,
            newType,
            newAnnotation,
            newSubGraph,
            newVis;

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
            	.appendTo(widgetContainer)

            var labelTitle = $('<div class = "widgetTitle"/>')
                .appendTo(labelRow)
                .html("Label:");

            var labelText = $('<div class = "widgetText"/>')
            	.appendTo(labelRow)
            	.html(label);

            if(annotation != "") {
    	        var annotationRow = $('<div class = "widgetRow"/>')
    	        	.appendTo(widgetContainer);

    	        var annotationTitle = $('<div class = "widgetTitle"/>')
    	            .appendTo(annotationRow)
    	            .html("Annotation:");

    	        var annotationText = $('<div class = "widgetText"/>')
    	        	.appendTo(annotationRow)
    	        	.html(annotation);
    	    }

            var visImg = $('<img class="widgetImg" draggable = "false">')
          		.appendTo(widgetContainer);

          	visImg[0].src = vis;

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

            var titleText = $('<h1>Node Properties</h1>')
                .appendTo(widgetContainer);

            var padForm = $('<div/>')
                .appendTo(widgetContainer);

            var labelInput = $('<input type = "text">')
                .appendTo(padForm)
                .val(label);

            if(category == "nodePanel") {
                var padDropdown = $('<div class = "PadDropdown"/>')
                    .appendTo(padForm);
            }

            var padAnnotation = $('<textarea class = "PadAnnotation"/>')
                .appendTo(padForm)
                .val(annotation);
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
            var padVis = $('<div class = "PadVisBox"/>')
                .appendTo(padForm);
            var padVisUploadText = $('<div>Please input a image</div>')
                .appendTo(padVis);
            var padVisUploadFile = $('<input type = "file" multiple size = "50"><br>')
                .appendTo(padVis);
            var padVisRemoveFile = $('<input type = "button" value = "Remove image">')
                .appendTo(padVis);
            var padVisUploadFileDemo = $('<img class = "PadVisDemo" draggable = "false"/>')
                .appendTo(padVis);

            var saveSubmitButton = $('<button type = "button" class = "btn btn-success">Save Change</button>')
                .appendTo(padForm);

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

            // Preview the vis
            if(vis != "") {
                padVisUploadFileDemo[0].src = vis;
            }

            padVisUploadFile.on('change', function() {
                var x = padVisUploadFile[0].files[0];
                console.log(x);
                var reader = new FileReader();
                reader.onload = function() {
                    padVisUploadFileDemo[0].src = reader.result;
                };
                reader.readAsDataURL(x);
            });

            padVisRemoveFile.on('click', function() {
                padVisUploadFileDemo.attr("src", null);
            });
            


            widgetContainer.width(width);
            widgetContainer.css('margin-top', marginTop);
            widgetContainer.css('margin-left', marginLeft);
            padAnnotation.width(width - 6);
            padVisUploadFile.css('margin-top', '3px');
            padVisRemoveFile.css('margin-top', '3px');



            // Callback for dropdown
            if(category == "nodePanel") {
                var dropdownChange = function(dropdownText) {
                    newType = dropdownText; 
                }

                dropdown({
                    container: padDropdown,
                    defaultVal: type,
                    list: [
                        "location", 
                        "people", 
                        "time",
                        "unknown",
                        "default"
                        ],
                    callback: dropdownChange
                });
            }

            container.show();

            saveSubmitButton.click(function() {
                saveStatus();
            })

            $(window).click(removePanel);

            function removePanel() {
                if(this.event.target == container[0]) {
                    saveStatus();
                }
            };

            function saveStatus() {
                newLabel = labelInput.val();
                newAnnotation = padAnnotation.val();
                newVis = padVisUploadFileDemo[0].src;
                newSubGraph = subGraph;
                container.empty();
                container.hide();
                $(window).off("mousemove", dragmove);
                $(window).off("mouseup", dragend);
                $(window).off("click", removePanel);
                if(category == "nodePanel") {
                    callback(newLabel, newType, newAnnotation, newSubGraph, newVis);
                } else if(category == "linkPanel") {
                    callback(newLabel, newAnnotation, newVis);
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



















