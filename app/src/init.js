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
    const snippetSearchhere = '<div id="search-here"><div class="text-center"><h4 >Woosmap和百度</h4><p>商店定位器</p><button id="search-here-btn" type="submit">我的附近</button></div></div>';
    const photosSrcThumbs = ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg", "16.jpg", "17.jpg", "18.jpg", "19.jpg", "20.jpg", "21.jpg", "22.jpg", "23.jpg", "24.jpg", "25.jpg", "26.jpg", "27.jpg", "28.jpg", "29.jpg", "30.jpg", "31.jpg", "32.jpg", "33.jpg", "34.jpg", "35.jpg", "36.jpg"];
    const photosSrcFull = ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg", "16.jpg", "17.jpg", "18.jpg", "19.jpg", "20.jpg", "21.jpg", "22.jpg", "23.jpg"];
    const iconSearchLoc = new BMap.Icon("https://www.woosmap.com/assets/locationanimation.svg", new BMap.Size(56, 56));
    let markerSearchLoc = new BMap.Marker(null, {icon: iconSearchLoc});
    let polyLineRoute = new BMap.Polyline(null, {strokeColor: "#3379C2", strokeOpacity: 1, strokeWeight: 8});
    let polyLineOverRoute = new BMap.Polyline(null, {strokeColor: "#01B3FD", strokeOpacity: 1, strokeWeight: 5});
    let currentSearch = "";
    let selectedStoreId = "";
    let map, mapView, tableView, dataSource = null;

    function getMap() {
        map = new BMap.Map('my-map');
        map.centerAndZoom(new BMap.Point(116.3964, 39.9093), 13);
        map.enableScrollWheelZoom();
        return map;
    }

    function displayMarkerSearch(point) {
        map.clearOverlays();
        markerSearchLoc.setPosition(point);
        map.addOverlay(markerSearchLoc);
    }

    function setStyleScrollListing($listingStores) {
        $listingStores.scroll(function () {
            const scroll = $listingStores.scrollTop();
            if (scroll > 0) {
                $listingStores.addClass("active");
            } else {
                $listingStores.removeClass("active");
            }
        });
    }

    function registerAutocomplete(inputId, callback) {
        const localSearch = new BMap.LocalSearch(map, {
            onSearchComplete: function (searchResult) {
                try {
                    if (searchResult.getPoi(0)) {
                        const latlng = searchResult.getPoi(0).point;
                        callback(latlng);
                    } else {
                        woosmap.$('#search-no-result').css('display', 'flex').addClass("animated fadeInDown");
                        setTimeout(function () {
                            woosmap.$('#search-no-result').removeClass().hide();
                        }, 3000);
                    }
                } catch (e) {
                    woosmap.$('#search-no-result').css('display', 'flex').addClass("animated fadeInDown");
                    setTimeout(function () {
                        woosmap.$('#search-no-result').removeClass().hide();
                    }, 3000);
                } finally {
                    woosmap.$('.buttonContainer.load').hide();
                    woosmap.$('.buttonContainer.clear').show();
                }
            }
        });

        const autocomplete = new BMap.Autocomplete({"input": inputId, "location": map});
        woosmap.$('#clear-button').click(function () {
            autocomplete.setInputValue('');
            woosmap.$('.buttonContainer.clear').hide();
            woosmap.$('#' + inputId).focus();
        });

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
            woosmap.$('.buttonContainer.clear').hide();
            woosmap.$('.buttonContainer.load').show();
            let valueToSearch = buildSearchText(e.item.value);
            currentSearch = valueToSearch;
            localSearch.search(valueToSearch);
            autocomplete.setInputValue(valueToSearch);
            woosmap.$('#' + inputId).blur();
        });
        woosmap.$('#' + inputId).keydown(function (event) {
            if (event.which === 13) {
                woosmap.$('.buttonContainer.clear').hide();
                woosmap.$('.buttonContainer.load').show();
                let valueToSearch = woosmap.$('#' + inputId).val();
                if (autocomplete.getResults() && autocomplete.getResults().getPoi(0)) {
                    valueToSearch = buildSearchText(autocomplete.getResults().getPoi(0));
                }
                currentSearch = valueToSearch;
                localSearch.search(currentSearch);
                autocomplete.setInputValue(valueToSearch);
                woosmap.$('#' + inputId).blur();
            }
        });
    }

    function drivingSearch(pointA, pointB) {
        var options = {
            onSearchComplete: function (results) {
                map.removeOverlay(polyLineRoute);
                map.removeOverlay(polyLineOverRoute);
                if (driving.getStatus() === BMAP_STATUS_SUCCESS) {
                    const drivingPanelHTML = [];
                    const firstPlan = results.getPlan(0);
                    drivingPanelHTML.push("<div class='flex-distance-duration'>" + firstPlan.getDistance() + " | " + firstPlan.getDuration() + "</div>");
                    drivingPanelHTML.push("<div class='flex-start-end-step'><span class='icon-driving start'></span>" + currentSearch + "</div>");
                    for (let i = 0; i < firstPlan.getNumRoutes(); i++) {
                        const route = firstPlan.getRoute(i);
                        if (route.getDistance(false) > 0) {
                            polyLineRoute.setPath(route.getPath());
                            polyLineOverRoute.setPath(route.getPath());
                            map.addOverlay(polyLineRoute);
                            map.addOverlay(polyLineOverRoute);
                        }
                        for (let j = 0; j < route.getNumSteps(); j++) {
                            const step = route.getStep(j);
                            drivingPanelHTML.push("<div class='flex-step'>" + step.getDescription() + "</div>");
                        }
                    }
                    drivingPanelHTML.push("<div class='flex-start-end-step'><span class='icon-driving end'></span>" + woosmap.$('.store-title').text() + "</div>");
                    woosmap.$("#driving-panel").html(drivingPanelHTML.join(""));
                    map.setViewport(polyLineRoute.getPath(), {enableAnimation: true, zoomFactor: -1});
                }
            }
        };
        const driving = new BMap.DrivingRoute(map, options);
        driving.search(pointA, pointB);

    }

    function clearMapSelectedStore() {
        map.removeOverlay(polyLineRoute);
        map.removeOverlay(polyLineOverRoute);
        tableView.set('selectedStore', null);
    }

    function renderRandomPhotos(cell, selector, photosSrc, rootPath) {
        woosmap.$(cell).find(selector + " img").each(function (index) {
            woosmap.$(this).attr("src", rootPath + photosSrc[Math.floor(Math.random() * photosSrc.length)]);
        });
    }

    function toggleAndSlideTableview(selectedStoreCell) {
        const $selectedStoreHTML = woosmap.$('#selected-store-container');
        const $listingStores = woosmap.$('#listing-stores-container');
        if (selectedStoreCell) {
            $selectedStoreCell = woosmap.$(selectedStoreCell).html();
            const $previousCell = $selectedStoreHTML.find(".woosmap-tableview-cell");
            if ($previousCell.length === 0) {
                $listingStores.removeClass('animated fadeOutLeft fadeInLeft').addClass('animated fadeOutLeft');
                $selectedStoreHTML.removeClass().addClass('animated fadeInRight');
            }
            woosmap.$('#search-input').addClass('selected-store');
            $selectedStoreHTML.show().html($selectedStoreCell);
            if ($listingStores.hasClass('home')) {
                woosmap.$('#back-to-results').html('Back to home');
            } else {
                woosmap.$('#back-to-results').html('Back to results');
            }
            woosmap.$('#back-to-results').click(function () {
                toggleAndSlideTableview();
                clearMapSelectedStore();
            });
            renderRandomPhotos($selectedStoreHTML, '.store-photo-header', photosSrcFull, "./images/full/");
            renderRandomPhotos($selectedStoreHTML, '.store-photo-list', photosSrcThumbs, "./images/thumbs/");
        } else {
            $selectedStoreHTML.removeClass().addClass('animated fadeOutRight');
            $listingStores.removeClass().addClass('animated fadeInLeft');
            woosmap.$('#search-input').removeClass('selected-store');
        }
    }

    const selectedStoreTemplate = "<div class='woosmap-tableview-cell'>" +
        "<div class='store-photo-header'><img /><div id='back-to-results'></div></div>" +
        "<div class='selected-store-card'><div class='hero'>" +
        "<div class='store-title'>{{name}}</div>" +
        "<div class='store-opened'>{{openlabel}}</div></div>" +
        "<div class='content'><div class='store-address'>{{address.lines}} {{address.city}} {{address.zip}}</div>" +
        "{{#contact.phone}}<div class='store-contact'>Tel : <a href='tel:{{contact.phone}}'>{{contact.phone}}</a></div>{{/contact.phone}}" +
        "</div></div><div class='store-photo-list'><div id='store-photo-list-header'>推荐菜</div><ul><li><img src='./images/starbucks-bg.png'/></li><li><img src='./images/starbucks-bg.png'/></li><li><img src='./images/starbucks-bg.png'/></li><li><img src='./images/starbucks-bg.png'/></li></ul>" +
        "</div><div id='driving-panel' class='content'></div>";


    function getRenderedTemplate(store) {
        const templateRenderer = new woosmap.TemplateRenderer(selectedStoreTemplate);
        const url = store.properties.contact.website;
        store.properties.openlabel = (store.properties.open && store.properties.open.open_now) ? "Open Now" : "Close";
        return templateRenderer.render(store.properties);
    }

    function searchStores(latlng) {
        dataSource.searchStoresByParameters(
            new woosmap.search.SearchParameters({
                lat: latlng.lat,
                lng: latlng.lng,
                storesByPage: 10
            }), function (stores) {
                tableView.set('stores', stores.features);
                woosmap.$('#listing-stores-container').removeClass('home');
                toggleAndSlideTableview();
            });
    }

    function main() {
        map = getMap();
        mapView = new woosmap.TiledView(map, woosmapOptions);
        dataSource = new woosmap.DataSource();
        tableView = new woosmap.ui.TableView({
            cell: '<div class="controls store-card">' +
                '<div>' +
                '<div><strong>{{name}} - {{address.city}}</strong></div>' +
                '<div>' +
                '<div id="store-address">{{address.lines}} {{address.city}} {{address.zip}}</div>' +
                '{{#contact.phone}}<div>Tel : <a href="tel:{{contact.phone}}">{{contact.phone}}</a></div>{{/contact.phone}}' +
                '</div>' +
                '</div>' +
                '<div class="store-photo"><img src="./images/starbucks-bg.png"/></div>' +
                '</div>'
        });

        woosmap.$(tableView.getContainer()).html(snippetSearchhere);
        woosmap.$('#listing-stores-container').append(tableView.getContainer());

        tableView.selectedStore_changed = function () {
            const selectedStore = tableView.get('selectedStore');
            if (selectedStore) {
                selectedStoreId = selectedStore.properties.store_id;
                const destPoint = new BMap.Point(selectedStore.geometry.coordinates[0], selectedStore.geometry.coordinates[1]);
                drivingSearch(markerSearchLoc.getPosition(), destPoint, map);
                toggleAndSlideTableview(getRenderedTemplate(selectedStore), tableView)
            }
        };

        tableView.setOnCellCreatedCallback(function (cell) {
            renderRandomPhotos(cell[0], '.store-photo', photosSrcThumbs, "./images/thumbs/");
        });

        mapView.bindTo('stores', tableView, 'stores', false);
        mapView.bindTo('selectedStore', tableView, 'selectedStore', false);

        woosmap.maps.utils.fitBounds = function fitBounds(map, bounds) {
            bounds.extend(markerSearchLoc.getPosition());
            map.setViewport([bounds.getSouthWest(), bounds.getNorthEast()])
        };

        registerAutocomplete("search-input", function (latlng) {
            searchStores(latlng);
            displayMarkerSearch(latlng);
        });
        woosmap.$("#search-here-btn").click(function () {
            const latlngPoint = map.getCenter();
            searchStores(latlngPoint);
            displayMarkerSearch(latlngPoint);
            currentSearch = '北京市';
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
