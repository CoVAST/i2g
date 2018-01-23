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
        <button id = "' + container + 'Button" class = "dropdownButton">' + defaultVal + '</button>
        <div id = "' + container + 'List" class = "dropdown-content"></div>
        */

        var dropdownButton = $('<button class = "dropdownButton">' + defaultVal + '</button>').appendTo(container);
        var dropdownContent = $('<div class = "dropdown-content"></div>').appendTo(container);

        dropdownContent.css('min-width', $('.nodePadModal-container').width());


        // dropdown list
        dropdownButton.click(function() {
            dropdownContent.show();
            dropdownContent.empty();
            list.forEach((d) => {
                $('<div style = "width: 100%;" class = "dropdownItem">' + d + '</div>').appendTo(dropdownContent).on('click', function() {
                    dropdownButton.text(d);
                    dropdownContent.hide();
                    callback(dropdownButton.text());
                    return false;
                });
            });
            return false;
        });

        callback(dropdownButton.text());
    }
})