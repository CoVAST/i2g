/** Add or change node property view */

define(function(require){
	var dropdown = require('./dropdown');

	return function(arg) {
        var option = arg || {},
        	container = option.container,
        	nodeLabel = option.nodeLabel || "New Node",
        	nodeType = option.nodeType || "unknown",
            nodeAnnotation = option.nodeAnnotation || "",
            nodeVis = option.nodeVis || "",
        	width = option.width || 300,
        	marginTop = option.marginTop || 0,
        	marginLeft = option.marginLeft || 0,
        	callback = option.callback;

        var newNodeLabel,
            newNodeType,
            newNodeAnnotation,
            newNodeVis;

        container.empty();

        /*						
		<div class = "PadModal-container"/>
			<h1>Node Properties</h1>
			<form>
				<input type="text" placeholder="' + nodeLabel + '">
				<div class = "PadDropdown"/>
                <textarea class = "PadAnnotation"/>
                <form class = "PadVisBox"/>
                    <div>Please input a file</div>
                    <input type = "file" multiple size = "50">
                    <img class = "PadVisDemo"/>
                </form>
                <button type="button" class = "btn btn-success">
                    Save Change
                </button>
			</form>
		</div>')
		*/

        var nodePadModalContainer = $('<div class = "PadModal-container"/>')
            .appendTo(container);
        var titleText = $('<h1>Node Properties</h1>')
            .appendTo(nodePadModalContainer);
        var nodePadForm = $('<form/>')
            .appendTo(nodePadModalContainer);
        var nodeLabelInput = $('<input type = "text">')
            .appendTo(nodePadForm)
            .val(nodeLabel);
        var nodePadDropdown = $('<div class = "PadDropdown"/>')
            .appendTo(nodePadForm);
        var nodePadAnnotation = $('<textarea class = "PadAnnotation"/>')
            .appendTo(nodePadForm)
            .val(nodeAnnotation);
        var nodePadVis = $('<form class = "PadVisBox"/>')
            .appendTo(nodePadForm);
        var nodePadVisUploadText = $('<div>Please input a image</div>')
            .appendTo(nodePadVis);
        var nodePadVisUploadFile = $('<input type = "file" multiple size = "50"><br>')
            .appendTo(nodePadVis);
        var nodePadVisRemoveFile = $('<input type = "button" value = "Remove image">')
            .appendTo(nodePadVis);
        var nodePadVisUploadFileDemo = $('<img class = "PadVisDemo"/>')
            .appendTo(nodePadVis);
        var saveSubmitButton = $('<button type = "button" class = "btn btn-success">Save Change</button>')
            .appendTo(nodePadForm);

        // Preview the vis
        if(nodeVis != "") {
            nodePadVisUploadFileDemo[0].src = nodeVis;
        }

        nodePadVisUploadFile.on('change', function() {
            var x = nodePadVisUploadFile[0].files[0];
            var reader = new FileReader();
            reader.onload = function(){
                nodePadVisUploadFileDemo[0].src = reader.result;
            };
            reader.readAsDataURL(x);
        });

        nodePadVisRemoveFile.on('click', function() {
            nodePadVisUploadFileDemo[0].src = "";
        });
        


        nodePadModalContainer.width(width);
        nodePadModalContainer.css('margin-top', marginTop);
        nodePadModalContainer.css('margin-left', marginLeft);
        nodePadAnnotation.width(width - 6);


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
        	container.hide();
        	callback(newNodeLabel, newNodeType, newNodeAnnotation, newNodeVis);
        })
        
    }
})