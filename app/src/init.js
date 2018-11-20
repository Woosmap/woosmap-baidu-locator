(function () {
    const woosmapOptions = {
        gentleCenter: true,
        style: {
            'default': {
                'icon': {
                    url: 'https://images.woosmap.com/starbucks-marker.svg',
                    scaledSize: {
                        height: 47,
                        width: 40
                    },
                },
                'selectedIcon': {
                    url: 'https://images.woosmap.com/starbucks-marker-selected.svg',
                    scaledSize: {
                        height: 71,
                        width: 61
                    }
                }
            }
        },
        tileStyle: {
            color: '#008248',
            size: 10,
            minSize: 5
        },
        breakPoint: 13
    };
    const photosSrcThumbs = ["/images/1.jpg", "/images/2.jpg", "/images/3.jpg", "/images/4.jpg", "/images/5.jpg"];
    const photosSrcFull = ["/images/full/1.jpg", "/images/full/2.jpg","/images/full/3.jpg", "/images/full/4.jpg","/images/full/5.jpg", "/images/full/6.jpg","/images/full/7.jpg", "/images/full/8.jpg","/images/full/9.jpg", "/images/full/10.jpg", "/images/full/11.jpg", "/images/full/12.jpg"];
    const iconSearchLoc = new BMap.Icon("https://www.woosmap.com/assets/locationanimation.svg", new BMap.Size(56, 56));
    let markerSearchLoc = new BMap.Marker(null, {icon: iconSearchLoc});
    let polyLineRoute = new BMap.Polyline(null, {strokeColor: "#3379C2", strokeOpacity: 1, strokeWeight: 8});
    let polyLineOverRoute = new BMap.Polyline(null, {strokeColor: "#01B3FD", strokeOpacity: 1, strokeWeight: 5});

    function getMap() {
        const map = new BMap.Map('my-map');
        map.centerAndZoom(new BMap.Point(116.3964, 39.9093), 13);
        map.enableScrollWheelZoom();
        return map;
    }

    function displayMarkerSearch(map, point) {
        map.clearOverlays();
        markerSearchLoc.setPosition(point);
        map.addOverlay(markerSearchLoc);
    }

    function setStyleScrollListing($listingStores) {
        $listingStores.scroll(function () {
            const scroll = $listingStores.scrollTop();
            if (scroll > 0) {
                $listingStores.addClass("active");
            }
            else {
                $listingStores.removeClass("active");
            }
        });
    }

    function registerAutocomplete(map, inputId, callback) {
        const localSearch = new BMap.LocalSearch(map, {
            onSearchComplete: function (searchResult) {
                if (searchResult.getPoi(0)) {
                    const latlng = searchResult.getPoi(0).point;
                    callback(latlng);
                }
                else {
                    console.log("no location attached to this search");
                }
            }
        });

        const autocomplete = new BMap.Autocomplete({"input": inputId, "location": map});

        function buildSearchText(autocompleteItem) {
            let searchText = autocompleteItem.business + " "
                + autocompleteItem.city + " "
                + autocompleteItem.district.replace('区', '') + " "
                + autocompleteItem.province + " "
                + autocompleteItem.street + " "
                + autocompleteItem.streetNumber;
            searchText = searchText.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            return searchText
        }

        autocomplete.addEventListener("onhighlight", function (e) {
            let highlightItem = {};
            if (e.fromitem.index > -1) {
                highlightItem = e.fromitem.value;
            }
            if (e.toitem.index > -1) {
                highlightItem = e.toitem.value;
            }
            if (!woosmap.$.isEmptyObject(highlightItem)) {
                autocomplete.setInputValue(buildSearchText(highlightItem));
            }
        });

        autocomplete.addEventListener("onconfirm", function (e) {
            let valueToSearch = buildSearchText(e.item.value);
            localSearch.search(valueToSearch);
            autocomplete.setInputValue(valueToSearch);
        });
    }

    function drivingSearch(pointA, pointB, map) {
        var options = {
            onSearchComplete: function (results) {
                map.removeOverlay(polyLineRoute);
                map.removeOverlay(polyLineOverRoute);
                if (driving.getStatus() === BMAP_STATUS_SUCCESS) {
                    const firstPlan = results.getPlan(0);
                    for (var i = 0; i < firstPlan.getNumRoutes(); i++) {
                        var route = firstPlan.getRoute(i);
                        if (route.getDistance(false) > 0) {
                            polyLineRoute.setPath(route.getPath());
                            polyLineOverRoute.setPath(route.getPath());
                            map.addOverlay(polyLineRoute);
                            map.addOverlay(polyLineOverRoute);
                        }
                    }
                    map.setViewport(polyLineRoute.getPath(), {enableAnimation: true, zoomFactor: -1});
                }
            }
        };
        const driving = new BMap.DrivingRoute(map, options);
        driving.search(pointA, pointB);

    }

    function renderRandomPhotos(cell, selector, photosSrc) {
        console.log(cell);
        woosmap.$(cell).find(selector + " img").each(function () {
            woosmap.$(this).attr("src", photosSrc[Math.floor(Math.random() * photosSrc.length)]);
        });
    }


    function toggleAndSlideTableview(selectedStoreCell) {
        const $selectedStoreHTML = woosmap.$('#selected-store-container');
        const $listingStores = woosmap.$('#listing-stores-container');
        if (selectedStoreCell) {
            $selectedStoreCell = woosmap.$(selectedStoreCell).html();
            const $previousCell = $selectedStoreHTML.find(".woosmap-tableview-cell");
            if ($previousCell.length === 0) {
                $listingStores.removeClass().addClass('animated fadeOutLeft');
                $selectedStoreHTML.removeClass().show().addClass('animated fadeInRight');
            }
            else {
                $previousCell.removeClass().addClass('animated fadeOutLeft');
                $selectedStoreCell.addClass('animated fadeInRight');
            }
            woosmap.$('#search-input').addClass('selected-store');
            $selectedStoreHTML.show().html($selectedStoreCell);
            renderRandomPhotos($selectedStoreHTML, '.store-photo-header', photosSrcFull);
            renderRandomPhotos($selectedStoreHTML, '.store-photo-list', photosSrcThumbs);
        }
        else {
            $selectedStoreHTML.removeClass().addClass('animated fadeOutRight');
            $listingStores.removeClass().show().addClass('animated fadeInLeft');
            woosmap.$('#search-input').removeClass('selected-store');
        }
    }

    const selectedStoreTemplate = "<div class='woosmap-tableview-cell'>" +
        "<div class='store-photo-header'><img src='images/full/1.jpg'/></div>" +
        "<div class='selected-store-card'><div class='hero'>" +
        "<div class='store-title'>{{name}}</div>" +
        "<div class='store-opened'>{{openlabel}}</div></div>" +
        "<div class='content'><div class='store-address'>{{address.lines}} {{address.city}} {{address.zip}}</div>" +
        "{{#contact.phone}}<div class='store-contact'>Tel : <a href='tel:{{contact.phone}}'>{{contact.phone}}</a></div>{{/contact.phone}}" +
        "</div></div><div class='controls store-photo-list'><ul><li><img/></li><li><img/></li><li><img/></li></ul></div>";


    function getRenderedTemplate(store) {
        const templateRenderer = new woosmap.TemplateRenderer(selectedStoreTemplate);
        const url = store.properties.contact.website;
        store.properties.openlabel = (store.properties.open.open_now) ? "Open Now" : "Close";
        return templateRenderer.render(store.properties);
    }

    function main() {
        const map = getMap();
        const mapView = new woosmap.TiledView(map, woosmapOptions);
        const dataSource = new woosmap.DataSource();
        const tableview = new woosmap.ui.TableView({
            cell: '<div class="controls store-card">' +
                '<div>' +
                '<div><strong>{{name}} - {{address.city}}</strong></div>' +
                '<div>' +
                '<div id="store-address">{{address.lines}} {{address.city}} {{address.zip}}</div>' +
                '{{#contact.phone}}<div>Tel : <a href="tel:{{contact.phone}}">{{contact.phone}}</a></div>{{/contact.phone}}' +
                '</div>' +
                '</div>' +
                '<div class="store-photo"><img src="https://images.woosmap.com/starbucks-bg.png"/></div>' +
                '</div>'
        });

        woosmap.$('#listing-stores-container').append(tableview.getContainer());

        tableview.selectedStore_changed = function () {
            const selectedStore = tableview.get('selectedStore');
            if (selectedStore) {
                const destPoint = new BMap.Point(selectedStore.geometry.coordinates[0], selectedStore.geometry.coordinates[1]);
                drivingSearch(markerSearchLoc.getPosition(), destPoint, map);
                toggleAndSlideTableview(getRenderedTemplate(selectedStore))
            }
        };

        tableview.setOnCellCreatedCallback(function (cell) {
            renderRandomPhotos(cell[0], '.store-photo', photosSrcThumbs);
        });

        mapView.bindTo('stores', tableview, 'stores', false);
        mapView.bindTo('selectedStore', tableview, 'selectedStore', false);

        woosmap.maps.utils.fitBounds = function fitBounds(map, bounds) {
            bounds.extend(markerSearchLoc.getPosition());
            map.setViewport([bounds.getSouthWest(), bounds.getNorthEast()])
        };

        registerAutocomplete(map, "search-input", function (latlng) {
            displayMarkerSearch(map, latlng);
            dataSource.searchStoresByParameters(
                new woosmap.search.SearchParameters({
                    lat: latlng.lat,
                    lng: latlng.lng,
                    storesByPage: 10
                }), function (stores) {
                    tableview.set('stores', stores.features);
                    toggleAndSlideTableview();
                });
        });
    }

    let loadOptions = {
        version: '1.4',
        publicKey: 'starbucks-demo-woos',
        callback: main,
        loadJQuery: true
    };

    if (window.attachEvent) {
        window.attachEvent('onload', function () {
            WoosmapLoader.load(loadOptions);
        });
    } else {
        window.addEventListener('load', WoosmapLoader.load(loadOptions), false);
    }
}());
