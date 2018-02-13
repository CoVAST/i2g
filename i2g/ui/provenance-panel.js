/* The standard form of the panel */

define(function(require) {

	return function(arg) {
		"use strict";

		var provenance = {};

		var option = arg || {},
			container = option.container || "body",
			vis = option.vis || "",
			annotation = option.annotation || "",
			width = option.width || 300,
			callback = option.callback;

        var removeButton = $('<div class = "removeProvenanceElement"/>')
            .appendTo(container)
            .html("\uf057")
            .click(function() {
                remove();
            });

		var padVis = $('<div class = "PadVisBox"/>')
            .appendTo(container);
        var padVisUploadText = $('<div>Please input a image</div>')
            .appendTo(padVis);
        var padVisUploadFile = $('<input type = "file" multiple size = "50"><br>')
            .width(width)
            .appendTo(padVis);
        var padVisRemoveFile = $('<input type = "button" value = "Remove image">')
            .appendTo(padVis);
        var padVisUploadFileDemo = $('<img class = "PadVisDemo" draggable = "false"/>')
            .appendTo(padVis);

        var annotationText = $('<div class = "PadText">Annotation:</div>')
            .appendTo(container);
        var padAnnotation = $('<textarea class = "PadAnnotation"/>')
            .appendTo(container)
            .val(annotation);

        // Preview the vis
        if(vis != "") {
            padVisUploadFileDemo[0].src = vis;
            padVisUploadFileDemo.css("margin-top", "10px");
        }

        padVisUploadFile.on('change', function() {
            var x = padVisUploadFile[0].files[0];
            var reader = new FileReader();
            reader.onload = function() {
                padVisUploadFileDemo[0].src = reader.result;
                padVisUploadFileDemo.css("margin-top", "10px");
            };
            reader.readAsDataURL(x);
        });

        padVisRemoveFile.on('click', function() {
            padVisUploadFileDemo.attr("src", null);
            padVisUploadFileDemo.css("margin-top", "0px");
        });



        padAnnotation.width(width - 6);
        padVisUploadFile.css('margin-top', '3px');
        padVisRemoveFile.css('margin-top', '3px');

        provenance.save = function() {
            var newVis = padVisUploadFileDemo[0].src,
                newAnnotation = padAnnotation.val();

            if(newVis != "" || newAnnotation != "") {
                return {
                    vis: newVis,
                    annotation: newAnnotation
                }
            } else {
                return null;
            }
        }

        function remove() {
            container.empty();
            container.hide();
            provenance.save = function() { return null; };
        }

		return provenance;
	}
})










