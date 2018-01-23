/** Add or change node property view */

define(function(require){
	var dropdown = require('./dropdown');

	return function(arg) {
        var option = arg || {},
        	container = option.container,
        	nodeLabel = option.nodeLabel || "New Node",
        	nodeType = option.nodeType || "unknown",
        	width = option.width || 300,
        	marginTop = option.marginTop || 0,
        	marginLeft = option.marginLeft || 0,
        	callback = option.callback;

        var newLabelText, newNodeType;

        container.empty();

        /*						
		<div class = "nodePadModal-container"/>
			<h1>Node Properties</h1>
			<form>
				<input type="text" placeholder="' + nodeLabel + '">
				<div></div>
				<button type="button" class = "btn btn-success">
					Save Change
				</button>
			</form>
		</div>')
		*/

        var nodePadModalContainer = $('<div class = "nodePadModal-container"/>').appendTo(container);
        var titleText = $('<h1>Node Properties</h1>').appendTo(nodePadModalContainer);
        var nodePadForm = $('<form/>').appendTo(nodePadModalContainer);
        var nodeLabelInput = $('<input type="text" placeholder="' + nodeLabel + '">').appendTo(nodePadForm);
        var nodePadDropdown = $('<div class = "nodePadDropdown"/>').appendTo(nodePadForm);
        var saveSubmitButton = $('<button type="button" class = "btn btn-success">Save Change</button>').appendTo(nodePadForm);
        

        var dropdownChange = function(dropdownText) {
        	newNodeType = dropdownText; 
        }

        nodePadModalContainer.width(width);
    	nodePadModalContainer.css('margin-top', marginTop);
    	nodePadModalContainer.css('margin-left', marginLeft);

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
        	newLabelText = nodeLabelInput.val() == '' ? nodeLabel : nodeLabelInput.val();
        	container.hide();
        	callback(newLabelText, newNodeType);
        })
        
    }
})