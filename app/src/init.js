(function () {
    const woosmapOptions = {
        gentleCenter: true,
        style: {
            'default': {
                'icon': {
                    url: 'https://images.woosmap.com/starbucks-marker.svg',
                    scaledSize: {
                        height: 38,
                        width: 38
                    },
                },
                'selectedIcon': {
                    url: 'https://images.woosmap.com/starbucks-marker.svg',
                    scaledSize: {
                        height: 45,
                        width: 45
                    },
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
    const iconSearchLoc = new BMap.Icon("https://www.woosmap.com/assets/locationanimation.svg", new BMap.Size(56, 56));
    let markerSearchLoc = new BMap.Marker(null, {icon: iconSearchLoc});

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

    function registerAutocomplete(map, inputId, callback) {
        const localSearch = new BMap.LocalSearch(map, {
            onSearchComplete: function (searchResult) {
                try {
                    const latlng = searchResult.getPoi(0).point;
                    callback(latlng);
                }
                catch (err) {
                    console.log("no location attached to this search")
                }
            }
        });

        var autocomplete = new BMap.Autocomplete({"input": inputId, "location": map});


        autocomplete.addEventListener("onhighlight", function (e) {
            let highlightItem = {};
            if (e.fromitem.index > -1) {
                highlightItem = e.fromitem.value;
            }
            if (e.toitem.index > -1) {
                highlightItem = e.toitem.value;
            }
            if (!woosmap.$.isEmptyObject(highlightItem)) {
                let valueToHighlight = highlightItem.business + " "
                    + highlightItem.city + " "
                    + highlightItem.district.replace('区', '') + " "
                    + highlightItem.province + " "
                    + highlightItem.street + " "
                    + highlightItem.streetNumber;
                valueToHighlight = valueToHighlight.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                autocomplete.setInputValue(valueToHighlight);
            }
        });


        autocomplete.addEventListener("onconfirm", function (e) {
            const baiduResult = e.item.value;
            let valueToSearch = baiduResult.business + " "
                + baiduResult.city + " "
                + baiduResult.district.replace('区', '') + " "
                + baiduResult.province + " "
                + baiduResult.street + " "
                + baiduResult.streetNumber;
            valueToSearch = valueToSearch.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            localSearch.search(valueToSearch);
            console.log(baiduResult);
            autocomplete.setInputValue(valueToSearch);
        });
    }

    function registerEventSearch(inputId, btnId, doSearch) {
        woosmap.$(inputId).keyup(function (event) {
            if (event.keyCode === 13) {
                woosmap.$(btnId).click();
            }
        });
        woosmap.$(btnId).click(function () {
            doSearch(woosmap.$(inputId).val());
        });
    }


    function main() {
        const map = getMap();
        const mapView = new woosmap.TiledView(map, woosmapOptions);
        const dataSource = new woosmap.DataSource();
        const tableview = new woosmap.ui.TableView({
            cell_store: '<div class="controls store-card"><div><p><strong>{{name}} - {{address.city}}</strong></p><div><div>{{address.lines}} {{address.city}} {{address.zip}}</div></div></div></div>',
            cell_place: '<div id="item" class="item"><a class="title">{{description}}</a></div>'
        });
        const listings = woosmap.$('#listing-stores-container');
        listings.append(tableview.getContainer());

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
