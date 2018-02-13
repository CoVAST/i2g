define(function(){
    const icons = {
        people: '\uf2be',
        time: '\uf017',
        date: '\uf017',
        location: '\uf041',
        unknown: '\uf059',
        default: ''
    };

    return function(type) {
        return icons.hasOwnProperty(type) ? icons[type] : icons['unknown'];
    }
})
