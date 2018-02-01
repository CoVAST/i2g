/* Show the compact details of the node or link */

define(function(require) {
	return function(arg) {
        "use strict";
		var option = arg || {},
			container = option.container || "body",
        	labelName = option.labelName || "",
            annotation = option.annotation || "",
            vis = option.vis || "",
        	width = option.width || 300,
        	color = option.color || null,
        	callback = option.callback;

        var dragging = false;
        var top, left;

        var myTooltip = {};

        /*						
		<div class = "myTooltip"/>
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

        var tooltipContainer = $('<div class = "myTooltip"/>')
            .appendTo(container);

        var functionRow = $('<div class = "myTooltipRow"/>')
        	.appendTo(tooltipContainer)
        	.css("display", "none");

        var close = $('<div class = "myTooltipClose"/>')
        	.appendTo(functionRow)
        	.html("\uf057")
        	.click(function() {
        		callback();
        	})
        	.mouseover(function() {
        		close.css("background-color", "#DDD");
        	})
        	.mouseleave(function() {
        		close.css("background-color", "transparent");
        	});

        /*
        var indicatorBar = $('<div class = "myTooltipIndicator"/>')
        	.appendTo(functionRow)
        	.css("background-color", color);
        */

        var labelRow = $('<div class = "myTooltipRow"/>')
        	.appendTo(tooltipContainer)

        var labelNameTitle = $('<div class = "myTooltipTitle"/>')
            .appendTo(labelRow)
            .html("Label:");

        var labelNameText = $('<div class = "myTooltipText"/>')
        	.appendTo(labelRow)
        	.html(labelName);

        if(annotation != "") {
	        var annotationRow = $('<div class = "myTooltipRow"/>')
	        	.appendTo(tooltipContainer);

	        var annotationTitle = $('<div class = "myTooltipTitle"/>')
	            .appendTo(annotationRow)
	            .html("Annotation:");

	        var annotationText = $('<div class = "myTooltipText"/>')
	        	.appendTo(annotationRow)
	        	.html(annotation);
	    }

        var visImg = $('<img class="myTooltipImg" draggable = "false">')
      		.appendTo(tooltipContainer);

      	visImg[0].src = vis;


        myTooltip.remove = function() {
        	tooltipContainer.remove();
        	return myTooltip;
        }

        myTooltip.changePosition = function(margin_top, margin_left) {
        	top = margin_top;
        	left = margin_left;
        	tooltipContainer.css("margin-top", margin_top);
        	tooltipContainer.css("margin-left", margin_left);
        	return myTooltip;
        }

        myTooltip.drag = function(dy, dx) {
        	top += dy;
        	left += dx;
        	tooltipContainer.css("margin-top", top);
        	tooltipContainer.css("margin-left", left);
        	return myTooltip;
        }

        tooltipContainer.mousedown((e) => {
        	dragging = true;
        })

        $(window).mousemove((e) => {
        	if(dragging) {
        		var dy = e.originalEvent.movementY;
        		var dx = e.originalEvent.movementX;
        		myTooltip.drag(dy, dx);
        	}
        })

        $(window).mouseup(function() {
        	dragging = false;
        })

        myTooltip.indicate = function() {
        	functionRow.show();
        	tooltipContainer.css("border", "3px solid " + color);
        }


        return myTooltip;
	}
})



















