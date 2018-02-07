/** dropdown list view */

define(function(require){
	return function(arg) {
        var option = arg || {},
        	container = option.container,
            category = option.category,
        	defaultVal = option.defaultVal,
        	list = option.list || [],
            callback = option.callback;

        container.empty();

        var dropdownButtonBox = $('<div class = "dropdownButtonBox"/>')
            .appendTo(container);
        var dropdownButtonText;
        if(category == "type") {
            dropdownButtonText = $('<div class = "dropdownButtonText">' + defaultVal + '</div>')
                .appendTo(dropdownButtonBox);
        } else if(category == "color") {
            dropdownButtonText = $('<div class = "dropdownButtonText"/>')
                .appendTo(dropdownButtonBox);
            if(defaultVal == "default") {
                dropdownButtonText.text(defaultVal);
            } else {
                dropdownButtonText.css("background-color", defaultVal);
            }
        }
        var dropdownButtonArrowBox = $('<div class = "dropdownButtonArrowBox"/>')
            .appendTo(dropdownButtonBox);
        var dropdownButtonArrow = $('<div class = "dropdownButtonArrow">')
            .appendTo(dropdownButtonBox);
        var dropdownContent = $('<div class = "dropdown-content"/>')
            .appendTo(container);

        dropdownContent.css('min-width', $('.PadModal-container').width());
        dropdownButtonArrow.css('margin-left', $('.PadModal-container').width() * 0.9 - 6);

        // dropdown list
        dropdownButtonBox.click(function() {
            dropdownContent.show();
            dropdownContent.empty();
            if(category == "type") {
                list.forEach((d) => {
                    $('<div style = "width: 100%;" class = "dropdownItem">' + d + '</div>')
                        .appendTo(dropdownContent)
                        .on('click', function() {
                            dropdownButtonText.text(d);
                            dropdownContent.hide();
                            callback(dropdownButtonText.text());
                            return false;
                        });
                });
            } else if(category == "color") {
                $('<div style = "width: 100%;" class = "dropdownItem">default</div>')
                    .appendTo(dropdownContent)
                    .on('click', function() {
                        dropdownButtonText.text("default");
                        dropdownButtonText.css("background-color", "#DDD");
                        dropdownContent.hide();
                        callback(dropdownButtonText.text());
                        return false;
                    });
                list.forEach((d) => {
                    $('<div style = "width: 100%;" class = "dropdownItem"/>')
                        .appendTo(dropdownContent)
                        .css("background-color", d)
                        .on('click', function() {
                            dropdownButtonText.text("");
                            dropdownButtonText.css("background-color", d);
                            dropdownContent.hide();
                            callback(dropdownButtonText.css("background-color"));
                            return false;
                        });
                });
            }
                
            return false;
        });

        if(category == "type") {
            callback(dropdownButtonText.text());
        } else if(category == "color") {
            if(defaultVal == "default") {
                callback(dropdownButtonText.text());
            } else {
                callback(dropdownButtonText.css("background-color"));
            }
        }
    }
})