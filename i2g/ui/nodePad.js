/** Add or change node property view */

define(function(require){
	var dropdown = require('./dropdown');

	return function(arg) {
        "use strict";
        var nodePad = {};

        var option = arg || {},
        	container = option.container,
        	nodeLabel = option.nodeLabel || "New Node",
        	nodeType = option.nodeType || "unknown",
            nodeAnnotation = option.nodeAnnotation || "",
            nodeSubGraph = option.nodeSubGraph || null,
            nodeVis = option.nodeVis || "",
        	width = option.width || 300,
        	marginTop = option.marginTop || 0,
        	marginLeft = option.marginLeft || 0,
        	callback = option.callback;

        var newNodeLabel,
            newNodeType,
            newNodeAnnotation,
            newNodeSubGraph,
            newNodeVis;

        var dragging = false;

        container.empty();

        /*						
		<div class = "PadModal-container"/>
			<h1>Node Properties</h1>
			<div>
				<input type="text" placeholder="' + nodeLabel + '">
				<div class = "PadDropdown"/>
                <textarea class = "PadAnnotation"/>
                <div class = "PadSubGraphBox"/>
                    <div>Please input a json file</div>
                    <input type = "file" multiple size = "50">
                </div>
                <div class = "PadVisBox"/>
                    <div>Please input a image</div>
                    <input type = "file" multiple size = "50">
                    <img class = "PadVisDemo"/>
                </div>
                <button type="button" class = "btn btn-success">
                    Save Change
                </button>
			</div>
		</div>')
		*/

        var nodePadModalContainer = $('<div class = "PadModal-container"/>')
            .appendTo(container);

        var titleText = $('<h1>Node Properties</h1>')
            .appendTo(nodePadModalContainer);

        var nodePadForm = $('<div/>')
            .appendTo(nodePadModalContainer);

        var nodeLabelInput = $('<input type = "text">')
            .appendTo(nodePadForm)
            .val(nodeLabel);

        var nodePadDropdown = $('<div class = "PadDropdown"/>')
            .appendTo(nodePadForm);

        var nodePadAnnotation = $('<textarea class = "PadAnnotation"/>')
            .appendTo(nodePadForm)
            .val(nodeAnnotation);
        /*
        var nodePadSubGraph = $('<div class = "PadSubGraphBox"/>')
            .appendTo(nodePadForm);
        var nodePadSubGraphUploadText = $('<div>Please input a json file</div>')
            .appendTo(nodePadSubGraph);
        var nodePadSubGraphUploadFile = $('<input type = "file" multiple size = "50"><br>')
            .appendTo(nodePadSubGraph);
        var nodePadSubGraphRemoveFile = $('<input type = "button" value = "Remove sub graph">')
            .appendTo(nodePadSubGraph);
        var nodePadSubGraphUploadFileDemo = $('<div class = "PadSubGraphDemo"/>')
            .appendTo(nodePadSubGraph);
        */
        var nodePadVis = $('<div class = "PadVisBox"/>')
            .appendTo(nodePadForm);
        var nodePadVisUploadText = $('<div>Please input a image</div>')
            .appendTo(nodePadVis);
        var nodePadVisUploadFile = $('<input type = "file" multiple size = "50"><br>')
            .appendTo(nodePadVis);
        var nodePadVisRemoveFile = $('<input type = "button" value = "Remove image">')
            .appendTo(nodePadVis);
        var nodePadVisUploadFileDemo = $('<img class = "PadVisDemo" draggable = "false"/>')
            .appendTo(nodePadVis);

        var saveSubmitButton = $('<button type = "button" class = "btn btn-success">Save Change</button>')
            .appendTo(nodePadForm);

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
        if(nodeVis != "") {
            nodePadVisUploadFileDemo[0].src = nodeVis;
        }

        nodePadVisUploadFile.on('change', function() {
            var x = nodePadVisUploadFile[0].files[0];
            console.log(x);
            var reader = new FileReader();
            reader.onload = function() {
                nodePadVisUploadFileDemo[0].src = reader.result;
            };
            reader.readAsDataURL(x);
        });

        nodePadVisRemoveFile.on('click', function() {
            nodePadVisUploadFileDemo.attr("src", null);
        });
        


        nodePadModalContainer.width(width);
        nodePadModalContainer.css('margin-top', marginTop);
        nodePadModalContainer.css('margin-left', marginLeft);
        nodePadAnnotation.width(width - 6);
        nodePadVisUploadFile.css('margin-top', '3px');
        nodePadVisRemoveFile.css('margin-top', '3px');



        // Callback for dropdown
        var dropdownChange = function(dropdownText) {
        	newNodeType = dropdownText; 
        }

        dropdown({
        	container: nodePadDropdown,
        	defaultVal: nodeType,
        	list: [
	        	"location", 
	        	"people", 
	        	"time",
	        	"unknown",
	        	"default"
	        	],
	        callback: dropdownChange
        });

        container.show();

        saveSubmitButton.click(function() {
        	newNodeLabel = nodeLabelInput.val();
            newNodeAnnotation = nodePadAnnotation.val();
            newNodeVis = nodePadVisUploadFileDemo[0].src;
            newNodeSubGraph = nodeSubGraph;
        	container.hide();
            $(window).off("mousemove", dragmove);
            $(window).off("mouseup", dragend);
            $(window).off("click", remove);
        	callback(newNodeLabel, newNodeType, newNodeAnnotation, newNodeSubGraph, newNodeVis);
        })



        nodePad.drag = function(dy, dx) {
            marginTop += dy;
            marginLeft += dx;
            nodePadModalContainer.css("margin-top", marginTop);
            nodePadModalContainer.css("margin-left", marginLeft);
            return nodePad;
        }

        nodePadModalContainer.mousedown((e) => {
            dragging = true;
        })

        $(window).mousemove(dragmove);

        $(window).mouseup(dragend);

        $(window).click(remove);

        function dragmove() {
            if(dragging) {
                var dy = this.event.movementY;
                var dx = this.event.movementX;
                nodePad.drag(dy, dx);
            }
        }

        function dragend() {
            dragging = false;
        }

        function remove() {
            if(this.event.target == container[0]) {
                container.empty();
                container.hide();
                $(window).off("mousemove", dragmove);
                $(window).off("mouseup", dragend);
                $(window).off("click", remove);
            }
        };


        return nodePad;
    }
})