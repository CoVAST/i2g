define(function(require){
    var Panel = require('vastui/panel');
    return function(arg) {
        var options = arg || {},
            container = options.container || 'body',
            id = options.id || 'igraph-notes',
            onopen = options.onopen || function(){};

        var notePanel = new Panel({
            container: container,
            id: id,
            padding: 10,
            style: {
                position: 'fixed',
                // display: 'none',
                bottom: 0,
                left: 0,
                height: 'auto',
                'text-align': 'right'
            }
        })

        notePanel.style.display = 'none';

        notePanel.show = function() {
            console.log(notePanel);
            notePanel.style.display = 'block';
            onopen();
        }

        notePanel.hide = function() {
            notePanel.style.display = 'none';
            onopen();
        }

        var wrapper = document.createElement('div'),
            field1 = document.createElement('div'),
            field2 = document.createElement('div');

        wrapper.className = 'ui form';
        field1.className = 'field';
        field2.className = 'field';
        field1.innerHTML = '<label>Label</label>';
        field2.innerHTML = '<label>Detail</label>';

        var input = document.createElement('input'),
            textarea = document.createElement('textarea');

        input.setAttribute('type', 'text');

        field1.appendChild(input);
        field2.appendChild(textarea);
        wrapper.appendChild(field1);
        wrapper.appendChild(field2);
        wrapper.style.textAlign = 'left';
        wrapper.style.marginBottom = '0.5em';
        notePanel.append(wrapper);

        notePanel.getNote = function() {
            return {
                label: inpute.value,
                detail: textarea.value
            };
        }

        notePanel.append(new Button({
            label: ' Save ',
            types: ['positive'],
            onclick: function(){
                notePanel.getNote();
                notePanel.hide();
            }
        }));

        notePanel.append(new Button({
            label: 'Cancel',
            types: ['negative'],
            onclick: notePanel.hide
        }));

        return notePanel;
    }
})
