/** dropdown list view */

define(function(require){
	return function(arg) {
        var option = arg || {},
        	container = option.container,
        	defaultVal = option.defaultVal,
        	list = option.list || [],
            callback = option.callback;

        container.empty();

        /*
        <div class = "dropdownButtonBox"/>
        <div class = "dropdownButtonText"> + defaultVal + </div>
        <div class = "dropdownButtonArrowBox"/>
        <div class = "dropdownButtonArrow">
        <div id = "' + container + 'List" class = "dropdown-content"/>
        */

        var dropdownButtonBox = $('<div class = "dropdownButtonBox"/>')
            .appendTo(container);
        var dropdownButtonText = $('<div class = "dropdownButtonText">' + defaultVal + '</div>')
            .appendTo(dropdownButtonBox);
        var dropdownButtonArrowBox = $('<div class = "dropdownButtonArrowBox"/>')
            .appendTo(dropdownButtonBox);
        var dropdownButtonArrow = $('<div class = "dropdownButtonArrow">')
            .appendTo(dropdownButtonBox);
        var dropdownContent = $('<div class = "dropdown-content"/>')
            .appendTo(container);

        dropdownContent.css('min-width', $('.nodePadModal-container').width());

        // dropdown list
        dropdownButtonBox.click(function() {
            dropdownContent.show();
            dropdownContent.empty();
            list.forEach((d) => {
                $('<div style = "width: 100%;" class = "dropdownItem">' + d + '</div>').appendTo(dropdownContent).on('click', function() {
                    dropdownButtonText.text(d);
                    dropdownContent.hide();
                    callback(dropdownButtonText.text());
                    return false;
                });
            });
            return false;
        });

        callback(dropdownButtonText.text());
    }
})