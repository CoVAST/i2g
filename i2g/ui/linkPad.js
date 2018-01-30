/** Add or change link property view */

define(function(require){
	var dropdown = require('./dropdown');

	return function(arg) {
        var option = arg || {},
        	container = option.container,
        	linkLabel = option.linkLabel || "new relation",
            linkAnnotation = option.linkAnnotation || "",
            linkVis = option.linkVis || "",
        	width = option.width || 300,
        	marginTop = option.marginTop || 0,
        	marginLeft = option.marginLeft || 0,
        	callback = option.callback;

        var newLinkLabel,
            newLinkAnnotation,
            newLinkVis;

        container.empty();

        /*						
		<div class = "PadModal-container"/>
			<h1>Link Properties</h1>
			<form>
				<input type="text" placeholder="' + linkLabel + '">
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

        var linkPadModalContainer = $('<div class = "PadModal-container"/>')
            .appendTo(container);
        var titleText = $('<h1>Link Properties</h1>')
            .appendTo(linkPadModalContainer);
        var linkPadForm = $('<form/>')
            .appendTo(linkPadModalContainer);
        var linkLabelInput = $('<input type = "text">')
            .appendTo(linkPadForm)
            .val(linkLabel);
        var linkPadAnnotation = $('<textarea class = "PadAnnotation"/>')
            .appendTo(linkPadForm)
            .val(linkAnnotation);
        var linkPadVis = $('<form class = "PadVisBox"/>')
            .appendTo(linkPadForm);
        var linkPadVisUploadText = $('<div>Please input a image</div>')
            .appendTo(linkPadVis);
        var linkPadVisUploadFile = $('<input type = "file" multiple size = "50"><br>')
            .appendTo(linkPadVis);
        var linkPadVisRemoveFile = $('<input type = "button" value = "Remove image">')
            .appendTo(linkPadVis);
        var linkPadVisUploadFileDemo = $('<img class = "PadVisDemo"/>')
            .appendTo(linkPadVis);
        var saveSubmitButton = $('<button type = "button" class = "btn btn-success">Save Change</button>')
            .appendTo(linkPadForm);

        // Preview the vis
        if(linkVis != "") {
            linkPadVisUploadFileDemo[0].src = linkVis;
        }

        linkPadVisUploadFile.on('change', function() {
            var x = linkPadVisUploadFile[0].files[0];
            var reader = new FileReader();
            reader.onload = function(){
                linkPadVisUploadFileDemo[0].src = reader.result;
            };
            reader.readAsDataURL(x);
        });

        linkPadVisRemoveFile.on('click', function() {
            linkPadVisUploadFileDemo[0].src = "";
        });
        


        linkPadModalContainer.width(width);
        linkPadModalContainer.css('margin-top', marginTop);
        linkPadModalContainer.css('margin-left', marginLeft);
        linkPadAnnotation.width(width - 6);


        container.show();

        saveSubmitButton.click(function() {
        	newLinkLabel = linkLabelInput.val();
            newLinkAnnotation = linkPadAnnotation.val();
            newLinkVis = linkPadVisUploadFileDemo[0].src;
        	container.hide();
        	callback(newLinkLabel, newLinkAnnotation, newLinkVis);
        })
        
    }
})