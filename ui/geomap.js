define(function(){

return function geoLocation(options) {
    var options = options || {};
    var onAdd = options.onadd || function() {console.log("spatiotemporal onadd callback hasn't been defined yet.")};
    var colorScheme = options.colorScheme;
    var relatedLocations = new L.LayerGroup();
    var primaryLocations = new L.LayerGroup();
    var importantLocations = new L.LayerGroup();
    var highlightPathsLayer = new L.LayerGroup();
    var highlightLocationsLayer = new L.LayerGroup();
    var circleRadius = 5;

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
            "Important Locations": importantLocations,
            "Highlight Locations": highlightLocationsLayer,
            "Highlight Paths": highlightPathsLayer,
        };
    // important locations
    var importantGeoColor = colorScheme.area;
    importantGeos = [];

    var removeImportantGeo = (geo) => {
        var index = importantGeos.indexOf(geo);
        if (index > -1) {
            importantGeos.splice(index, 1);
            importantLocations.removeLayer(geo.leaflet);
        }
    }

    var removeImportantGeos = (geos) => {
        geos = Array.isArray(geos)? geos : [geos];
        geos.forEach(function(geo){
            removeImportantGeo(geo);
        });
    }

    let setCursorToCrosshair = () => map._container.style.cursor = 'crosshair';
    let resetCursor = () => map._container.style.cursor = '';
    let prepareAddImportantLocation = (e) => {
        setCursorToCrosshair();
        map.on('click',  addImportantLocation);
    }

    var addImportantGeos = (geos) => {
        geos = Array.isArray(geos)? geos : [geos];
        geos.forEach(function(geo){
            importantGeos.push(geo);
            geo.leaflet.addTo(importantLocations);
        })
    }

    var addImportantLocation = (e) => {
        //console.log('addImportantLocation');
        var geo = {
            type: 'point',
            coordinates: e.latlng,
            leaflet: L.marker(e.latlng, {
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
            })
        }

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
                weight: 8,
                contextmenu: true,
                contextmenuItems: [{
                    separator: true,
                    index: 0
                }]
            })
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
        // thePath.leaflet.addContextMenuItem({
        //     text: "Remove",
        //     index: 0,
        //     callback: removeImportantGeo.bind(this, thePath)
        // });
        resetCursor();
        map.doubleClickZoom.enable();
        map.off('click', addingImportantPath, thePath);
        map.off('dblclick', doneAddImportantPath, thePath);
        onAdd.call(this, thePath);
    }
    var prepareAddImportantPolygon = (e) => {
        setCursorToCrosshair();
        map.doubleClickZoom.disable();
        let thePolygon = {
            type: 'polygon',
            coordinates: [],
            leaflet: L.polygon([], {
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
        map.on('click', addingImportantPolygon, thePolygon);
        map.on('dblclick', doneAddImportantPolygon, thePolygon);
        // isAddingImportantPolygon = true;
        // onAdd.call(this, thePolygon);
    }
    var addingImportantPolygon = function(e) {
        let thePolygon = this;
        thePolygon.coordinates.push(e.latlng);
        thePolygon.leaflet.addLatLng(e.latlng);
    }
    var doneAddImportantPolygon = function(e) {
        let thePolygon = this;
        importantGeos.push(thePolygon);
        // thePolygon.leaflet.addContextMenuItem({
        //     text: "Remove",
        //     index: 0,
        //     callback: removeImportantGeo.bind(this, thePolygon)
        // })
        resetCursor();
        map.doubleClickZoom.enable();
        map.off('click', addingImportantPolygon, thePolygon);
        map.off('dblclick', doneAddImportantPolygon, thePolygon);
        onAdd.call(this, thePolygon);
        // isAddingImportantPolygon = false;
    }
    var prepareAddImportantRect = (e) => {
        //console.log('prepareAddImportantRect');
        setCursorToCrosshair();
        isAddingImportantRect = true;
        let theRect = {
            type: 'rect',
            coordinates: [],
            leaflet: null
        }
        map.on('mousedown', startAddImportantRect, theRect);
        map.on('mousemove', addingImportantRect, theRect);
        map.on('mouseup', doneAddImportantRect, theRect);
        map.dragging.disable();
    }
    var startAddImportantRect = function(e) {
        //console.log('startAddImportantRect');
        let theRect = this;
        theRect.coordinates = [e.latlng, e.latlng];
        theRect.leaflet = L.rectangle(theRect.coordinates, {
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
        })
        L.DomEvent.stop(e);
    }
    var addingImportantRect = function(e) {
        let theRect = this;
        if (!theRect.leaflet)
            return;
        theRect.coordinates[1] = e.latlng;
        theRect.leaflet.setBounds(theRect.coordinates);
        L.DomEvent.stop(e);
    }
    var doneAddImportantRect = function(e) {
        //console.log('doneAddImportantRect');
        let theRect = this;
        theRect.coordinates[1] = e.latlng;
        // theRect.leaflet.addContextMenuItem({
        //     text: "Remove",
        //     index: 0,
        //     callback: removeImportantGeo.bind(this, theRect)
        // });
        resetCursor();
        map.off('mousedown', startAddImportantRect, theRect);
        map.off('mousemove', addingImportantRect, theRect);
        map.off('mouseup', doneAddImportantRect, theRect);
        map.dragging.enable();
        onAdd.call(this, theRect);
        // isAddingImportantRect = false;
    }
    // set map center at SF
    var map = L.map('map-body', {
        center: options.mapCenter || [8.7832, -124.5085],
        zoom: options.mapZoom || 12,
        layers: [
            grayscale,
            primaryLocations,
            relatedLocations,
            importantLocations,
            highlightPathsLayer,
            highlightLocationsLayer
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
            {
                text: 'Add polygon',
                callback: prepareAddImportantPolygon
            },
            {
                text: 'Add path',
                callback: prepareAddImportantPath
            }
        ]
    });
    gMap = map;

    L.control.layers(baseLayers, overlays).addTo(map);


    function colorMap() {
        return '#000';
    }

    function addLocations(locs, params) {
        var c = params.color || 'steelblue',
            a = params.alpah || 0.5,
            r = params.size || circleRadius;

        return locs.map(function(loc){
            return L.circleMarker([loc.lat, loc.long], {
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

    function highlightPaths(pathObjs) {
        highlightPathsLayer.clearLayers();
        return R.map(pathObj => {
            return L.polyline(pathObj.latlngs, pathObj.options)
                .addTo(highlightPathsLayer);
        }, pathObjs);
    }

    function highlightLocations(locObjs) {
        if (R.isEmpty(locObjs)) {
            highlightLocationsLayer.clearLayers();
            // primaryLocations.invoke('setStyle', {
            //     fillOpacity: 0.5
            // });
            return;
        }
        // primaryLocations.eachLayer(layer => {
        //     layer.setStyle({
        //         fillOpacity: 0.02
        //     });
        // });

        let nNewCircles = locObjs.length - highlightLocationsLayer.getLayers().length;
        if (nNewCircles > 0) {
            for (let i = 0; i < nNewCircles; ++i) {
                L.circleMarker([0, 0], { radius: circleRadius }).addTo(highlightLocationsLayer);
            }
        }
        let layers = highlightLocationsLayer.getLayers();
        // console.log(layers);
        for (let i = 0; i < locObjs.length; ++i) {
            layers[i].setLatLng(locObjs[i].latlng);
            layers[i].setStyle(locObjs[i].options);
        }
        for (let i = locObjs.length; i < layers.length; ++i) {
            layers[i].setStyle({ opacity: 0, fillOpacity: 0 });
        }

        // highlightLocationsLayer.clearLayers();
        // return R.map(loc => {
        //     let options = R.clone(loc.options);
        //     /// TODO: also check other properties.
        //     if (R.isNil(options.radius)) options.radius = circleRadius;
        //     // console.log(options);
        //     return L.circleMarker(loc.latlng, options).addTo(highlightLocationsLayer)
        // }, locObjs);
    }

    return {
        relatedLocations: relatedLocations,
        primaryLocations: primaryLocations,
        importantLocations: importantLocations,
        onadd: function(cb) { onAdd = cb;},
        addLocations: addLocations,
        removeLocations: removeLocations,
        highlightLocations: highlightLocations,
        highlightPaths: highlightPaths,
        flyToBounds: R.bind(map.flyToBounds, map),
        flyTo: R.bind(map.flyTo, map),
        removeImportantGeos: removeImportantGeos,
        addImportantGeos: addImportantGeos,
        getZoom: () => map.getZoom(),
        getCenter: () => map.getCenter(),
    }
}

})
