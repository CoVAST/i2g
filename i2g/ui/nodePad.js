/** Add or change node property view */

define(function(require){
	var dropdown = require('./dropdown');

	return function(arg) {
        var option = arg || {},
        	container = option.container,
        	nodeLabel = option.nodeLabel || "New Node",
        	nodeType = option.nodeType || "unknown",
            nodeAnnotation = option.nodeAnnotation || "",
        	width = option.width || 300,
        	marginTop = option.marginTop || 0,
        	marginLeft = option.marginLeft || 0,
        	callback = option.callback;

        var newNodeLabel, newNodeType;

        container.empty();

        /*						
		<div class = "nodePadModal-container"/>
			<h1>Node Properties</h1>
			<form>
				<input type="text" placeholder="' + nodeLabel + '">
				<div class = "nodePadDropdown"/>
                <textarea class = "nodePadAnnotation"/>
				<button type="button" class = "btn btn-success">
					Save Change
				</button>
			</form>
		</div>')
		*/

        var nodePadModalContainer = $('<div class = "nodePadModal-container"/>').appendTo(container);
        var titleText = $('<h1>Node Properties</h1>').appendTo(nodePadModalContainer);
        var nodePadForm = $('<form/>').appendTo(nodePadModalContainer);
        var nodeLabelInput = $('<input type = "text">').appendTo(nodePadForm).val(nodeLabel);
        var nodePadDropdown = $('<div class = "nodePadDropdown"/>').appendTo(nodePadForm);
        var nodePadAnnotation = $('<textarea class = "nodePadAnnotation"/>').appendTo(nodePadForm).val(nodeAnnotation);
        var saveSubmitButton = $('<button type = "button" class = "btn btn-success">Save Change</button>').appendTo(nodePadForm);
        

        var dropdownChange = function(dropdownText) {
        	newNodeType = dropdownText; 
        }

        nodePadModalContainer.width(width);
    	nodePadModalContainer.css('margin-top', marginTop);
    	nodePadModalContainer.css('margin-left', marginLeft);
        nodePadAnnotation.width(width - 6);

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
        })

        container.show();

        saveSubmitButton.click(function() {
        	newNodeLabel = nodeLabelInput.val();
            newNodeAnnotation = nodePadAnnotation.val();
        	container.hide();
        	callback(newNodeLabel, newNodeType, newNodeAnnotation);
        })
        
    }
})