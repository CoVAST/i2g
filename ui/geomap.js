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
        var isAddingImportantPolygon = false;
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

            onAdd.call(this, geo);
        }
        var prepareAddImportantPolygon = (e) => {
            map._container.style.cursor = 'crosshair';
            map.doubleClickZoom.disable();
            isAddingImportantPolygon = true;
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
                    callback:
                        removeImportantGeo.bind(this, tempImportantPolygon)
                })
            }
            tempImportantPolygon.coordinates.push(e.latlng);
            tempImportantPolygon.leaflet.addLatLng(e.latlng);
        }
        var doneAddImportantPolygon = (e) => {
            onAdd.call(this, tempImportantPolygon);
            importantGeos.push(tempImportantPolygon);
            tempImportantPolygon = null;
            map._container.style.cursor = '';
            map.doubleClickZoom.enable();
            isAddingImportantPolygon = false;
        }
        var prepareAddImportantRect = (e) => {
            //console.log('prepareAddImportantRect');
            map._container.style.cursor = 'crosshair';
            isAddingImportantRect = true;
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
        }
        var addingImportantRect = (e) => {
            if (!tempImportantRect) {
                return;
            }
            tempImportantRect.coordinates[1] = e.latlng;
            tempImportantRect.leaflet.setBounds(
                    tempImportantRect.coordinates);
        }
        var doneAddImportantRect = (e) => {
            //console.log('doneAddImportantRect');
            tempImportantRect.coordinates[1] = e.latlng;
            onAdd.call(this, tempImportantRect);
            importantGeos.push(tempImportantRect);
            tempImportantRect = null;
            map._container.style.cursor = '';
            isAddingImportantRect = false;
        }
        // set map center at SF
        var map = L.map('map-body', {
            center: [37.830348, -122.386052],
            zoom: 12,
            layers: [
                grayscale,
                primaryLocations,
                relatedLocations,
                importantLocations
            ],
            contextmenu: true,
            contextmenuWidth: 140,
            contextmenuItems: [{
                text: 'Add location',
                callback: addImportantLocation
            }, {
                text: 'Add rectangle',
                callback: prepareAddImportantRect
            }, {
                text: 'Add polygon',
                callback: prepareAddImportantPolygon
            }]
        });
        gMap = map;

        L.control.layers(baseLayers, overlays).addTo(map);
        map.on("zoomend", function(){
            //console.log(map.getBounds());
        })

        map.on('mousedown', function(e) {
            //console.log('mousedown');
            if (isAddingImportantRect) {
                startAddImportantRect(e);
                map.dragging.disable();
                L.DomEvent.stop(e);
            }
        })

        var contextmenu = L.popup();
        map.on('mouseup', function(e) {
            //console.log('mouseup');
            if (isAddingImportantRect) {
                doneAddImportantRect(e);
                map.dragging.enable();
                L.DomEvent.stop(e);
            }
        })

        map.on('mousemove', function(e) {
            //console.log('mousemove');
            if (isAddingImportantRect) {
                addingImportantRect(e);
                L.DomEvent.stop(e);
            }
        })

        map.on('click', function(e) {
            //console.log('click');
            if (isAddingImportantPolygon) {
                addingImportantPolygon(e);
                L.DomEvent.stop(e);
            }
        })

        map.on('dblclick', function(e) {
            if (isAddingImportantPolygon) {
                doneAddImportantPolygon(e);
                L.DomEvent.stop(e);
            }
        })

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
