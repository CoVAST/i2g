define(function(){

return function geoLocation(options) {
    var options = options || {};
    var onAdd = options.onadd || function() {};
    var relatedLocations = new L.LayerGroup();
    var primaryLocations = new L.LayerGroup();
    var importantLocations = new L.LayerGroup();
    gImportantLocations = importantLocations;

    var mbAttr = 'Map data &copy; ' +
            '<a href="http://openstreetmap.org">OpenStreetMap</a> ' +
            '© <a href="http://mapbox.com">Mapbox</a>',
        mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?acc'
              + 'ess_token=pk.eyJ1IjoianBsaTEyMjEiLCJhIjoiY2oyM3B4NTcxMDA'
              + 'wbTMzc2M5eGltbzY0MyJ9.HD8mo8i8kawQNmrbZbYo-g';

    var grayscale  =
            L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr}),
        streets =
            L.tileLayer(
                mbUrl, {id: 'mapbox.streets',   attribution: mbAttr}),
        baseLayers = {"Grayscale": grayscale, "Streets": streets},
        overlays = {
            "Primary Locations": primaryLocations,
            "Related People": relatedLocations,
            "Important Locations": importantLocations
        };
    // important locations
    var isAddingImportantRect = false;
    var tempImportantRect = null;
    var tempImportantPolygon = null;
    var importantGeoColor = 'red';
    importantGeos = [];
    var removeImportantGeo = (geo) => {
        var index = importantGeos.indexOf(geo);
        if (index > -1) {
            importantGeos.splice(index, 1);
            importantLocations.removeLayer(geo.leaflet);
        }
    }
    let setCursorToCrosshair = () => map._container.style.cursor = 'crosshair';
    let resetCursor = () => map._container.style.cursor = '';
    let prepareAddImportantLocation = (e) => {
        setCursorToCrosshair();
        map.on('click',  addImportantLocation);
    }
    var addImportantLocation = (e) => {
        //console.log('addImportantLocation');
        var geo = {
            type: 'point',
            coordinates: e.latlng,
            leaflet: L.circleMarker(e.latlng, {
                color: 'none',
                fillColor: importantGeoColor,
                // weight: 1,
                fillOpacity: 0.5,
                radius: 10,
                contextmenu: true,
                contextmenuItems: [{
                    separator: true,
                    index: 0
                }]
            }).addTo(importantLocations)
        }
        geo.leaflet.addContextMenuItem({
            text: "Remove",
            index: 0,
            callback: removeImportantGeo.bind(this, geo)
        })
        importantGeos.push(geo);
        map.off('click', addImportantLocation);
        resetCursor();
        onAdd.call(this, geo);
    }
    let prepareAddImportantPath = e => {
        setCursorToCrosshair();
        map.doubleClickZoom.disable();
        let thePath = {
            type: 'polyline',
            coordinates: [],
            leaflet: L.polyline([], {
                color: importantGeoColor,
                opacity: 0.8,
                weight: 1,
                contextmenu: true,
                contextmenuItems: [{
                    separator: true,
                    index: 0
                }]
            }).addTo(importantLocations)
        };
        map.on('click', addingImportantPath, thePath);
        map.on('dblclick', doneAddImportantPath, thePath);
    }
    let addingImportantPath = function(e) {
        let thePath = this;
        thePath.coordinates.push(e.latlng);
        thePath.leaflet.addLatLng(e.latlng);
    }
    let doneAddImportantPath = function(e) {
        let thePath = this;
        importantGeos.push(thePath);
        thePath.leaflet.addContextMenuItem({
            text: "Remove",
            index: 0,
            callback: removeImportantGeo.bind(this, thePath)
        });
        resetCursor();
        map.doubleClickZoom.enable();
        map.off('click', addingImportantPath, thePath);
        map.off('dblclick', doneAddImportantPath, thePath);
        onAdd.call(this, thePath);
    }
    var prepareAddImportantPolygon = (e) => {
        setCursorToCrosshair();
        map.doubleClickZoom.disable();
        map.on('click', addingImportantPolygon);
        map.on('dblclick', doneAddImportantPolygon);
        // isAddingImportantPolygon = true;
    }
    var addingImportantPolygon = (e) => {
        if (!tempImportantPolygon) {
            tempImportantPolygon = {
                type: 'polygon',
                coordinates: [e.latlng],
                leaflet: L.polygon([e.latlng], {
                    color: importantGeoColor,
                    opacity: 0.8,
                    weight: 1,
                    fillColor: importantGeoColor,
                    fillOpacity: 0.5,
                    contextmenu: true,
                    contextmenuItems: [{
                        separator: true,
                        index: 0
                    }]
                }).addTo(importantLocations)
            }
            tempImportantPolygon.leaflet.addContextMenuItem({
                text: "Remove",
                index: 0,
                callback: removeImportantGeo.bind(this, tempImportantPolygon)
            })
        }
        tempImportantPolygon.coordinates.push(e.latlng);
        tempImportantPolygon.leaflet.addLatLng(e.latlng);
    }
    var doneAddImportantPolygon = (e) => {
        onAdd.call(this, tempImportantPolygon);
        importantGeos.push(tempImportantPolygon);
        tempImportantPolygon = null;
        resetCursor();
        map.doubleClickZoom.enable();
        map.off('click', addingImportantPolygon);
        map.off('dblclick', doneAddImportantPolygon);
        // isAddingImportantPolygon = false;
    }
    var prepareAddImportantRect = (e) => {
        //console.log('prepareAddImportantRect');
        setCursorToCrosshair();
        isAddingImportantRect = true;
        map.on('mousedown', startAddImportantRect);
        map.on('mousemove', addingImportantRect);
        map.on('mouseup', doneAddImportantRect);
        map.dragging.disable();
    }
    var startAddImportantRect = (e) => {
        //console.log('startAddImportantRect');
        tempImportantRect = {
            type: 'rect',
            coordinates: [e.latlng, e.latlng],
            leaflet: L.rectangle([e.latlng, e.latlng], {
                color: importantGeoColor,
                opacity: 0.8,
                weight: 1,
                fillColor: importantGeoColor,
                fillOpacity: 0.5,
                contextmenu: true,
                contextmenuItems: [{
                    separator: true,
                    index: 0
                }]
            }).addTo(importantLocations)
        }
        tempImportantRect.leaflet.addContextMenuItem({
            text: "Remove",
            index: 0,
            callback: removeImportantGeo.bind(this, tempImportantRect)
        })
        L.DomEvent.stop(e);
    }
    var addingImportantRect = (e) => {
        if (!tempImportantRect) {
            return;
        }
        tempImportantRect.coordinates[1] = e.latlng;
        tempImportantRect.leaflet.setBounds(
                tempImportantRect.coordinates);
        L.DomEvent.stop(e);
    }
    var doneAddImportantRect = (e) => {
        //console.log('doneAddImportantRect');
        tempImportantRect.coordinates[1] = e.latlng;
        onAdd.call(this, tempImportantRect);
        importantGeos.push(tempImportantRect);
        tempImportantRect = null;
        resetCursor();
        map.off('mousedown', startAddImportantRect);
        map.off('mousemove', addingImportantRect);
        map.off('mouseup', doneAddImportantRect);
        map.dragging.enable();
        // isAddingImportantRect = false;
    }
    // set map center at SF
    var map = L.map('map-body', {
        center: [39.871822355, 116.404827115],
        zoom: 12,
        layers: [
            grayscale,
            primaryLocations,
            relatedLocations,
            importantLocations
        ],
        contextmenu: true,
        contextmenuWidth: 140,
        contextmenuItems: [
            {
                text: 'Add location',
                callback: prepareAddImportantLocation
            },
            {
                text: 'Add rectangle',
                callback: prepareAddImportantRect
            },
            // {
            //     text: 'Add polygon',
            //     callback: prepareAddImportantPolygon
            // },
            {
                text: 'Add path',
                callback: prepareAddImportantPath
            }
        ]
    });
    gMap = map;

    L.control.layers(baseLayers, overlays).addTo(map);

    function addLocations(locs, params) {
        var c = params.color || 'steelblue',
            a = params.alpah || 0.5,
            r = params.size || 200;

        return locs.map(function(loc){
            return L.circle([loc.lat, loc.long], {
                color: 'none',
                fillColor: c,
                // weight: 1,
                fillOpacity: a,
                radius: r
            }).addTo(primaryLocations);
        })
    }

    function removeLocations(locs) {
        locs.forEach(function(loc){
            primaryLocations.removeLayer(loc);
        })
    }

    // map.on('contextmenu', function() {
    //     console.log('contextmenu');
    // })

    // // add marker on map
    // var markCount = 0;
    // map.on('dblclick', function(e){
    //     var marker = new L.marker(e.latlng).addTo(map);
    //     markCount += 1;
    // });

    return {
        relatedLocations: relatedLocations,
        primaryLocations: primaryLocations,
        importantLocations: importantLocations,
        onadd: function(cb) { onAdd = cb;},
        addLocations: addLocations,
        removeLocations: removeLocations,
        flyToBounds: R.bind(map.flyToBounds, map)
    }
}

})
