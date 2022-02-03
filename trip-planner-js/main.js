var map;
var marker;
var markerAddress;
var categoryMarkers = [];
var infoWindow;
var geocoder;
var service;
var directionsService;
var directionsRenderer;
var searchBox;
var input;

var plannerContainer;
var plannerOrigin;
var plannerDestination;
var origin;
var waypoints = [];
var destination;

var categoriesButtons = [];
var restaurantsCat = document.getElementById('restaurants'); 
var drinksCat = document.getElementById('drinks');
var parksCat = document.getElementById('parks');
var cultureCat = document.getElementById('culture'); 
var shopsCat = document.getElementById('shops');

var toolbox = document.getElementById('toolbox');

var clearMarkersButton = document.getElementById('clear-markers');
var setAsOriginButton = document.getElementById('set-origin');
var setAsWaypointButton = document.getElementById('set-waypoint');
var setAsDestinationButton = document.getElementById('set-destination');

categoriesButtons.push(restaurantsCat);
categoriesButtons.push(drinksCat);
categoriesButtons.push(parksCat);
categoriesButtons.push(cultureCat);
categoriesButtons.push(shopsCat);

var clearRoute = document.getElementById('clear-route');
var generateRouteButton = document.getElementById('generate-route');

function initMap() { 
    map = new google.maps.Map(document.getElementById("map"), {        
        // Center pending to be changed to user's location
        center: { lat: 40.416729, lng: -3.703339 },
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        draggableCursor: 'crosshair'
    });

    service = new google.maps.places.PlacesService(map);
    
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);


    input = document.getElementById('search-input');
    searchBox = new google.maps.places.SearchBox(input);

    searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        const bounds = new google.maps.LatLngBounds();

        removeMarkers();
        places.forEach((place) => {
            const searchMarker = new google.maps.Marker({
                map: map,
                position: place.geometry.location,
            })
            categoryMarkers.push(searchMarker);
            
            if (place.geometry.viewport) {
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        map.fitBounds(bounds);

    });

    google.maps.event.addListener(map, 'click', function(event) {
        placeMarker(event, map);
    });
}


function placeMarker(point, map) {
    geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        location: point.latLng
    }).then((response) => {
        console.log(response.results[0])
        if (response.results[0]) {
            markerAddress = response.results[0].formatted_address;
        }
        if (!marker) {
            marker = new google.maps.Marker({
                position: point.latLng,
                map: map
            });  
        } else {
            marker.setMap(map);
            marker.setPosition(point.latLng);
            map.panTo(point.latLng);
        }
        unlockToolbox();
    }); 
}

function placeCategoryMarkers(places) {
    removeMarkers();
    unlockToolbox();
    places.forEach(place => {
        const iW = new google.maps.InfoWindow({ content: place.name });
        const mark = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name
        });

        mark.addListener('click', () => {
            displayInfoWindow(iW, mark);
            marker = mark;
            unlockToolbox();
            markerAddress = place.name;
        });
        categoryMarkers.push(mark);
    });
}

function removeMarkers() {
    categoryMarkers.forEach(marker => {
        marker.setMap(null);
    });
    categoryMarkers.length = 0;
    lockToolbox();
}

function placeMarkersCallback(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        placeCategoryMarkers(results);
    }
}

function displayInfoWindow(iW, marker) {
    if (infoWindow) {
        infoWindow.close();
    }
    iW.open({
        anchor: marker,
        map,
        shouldFocus: false
    });
    infoWindow = iW;
}

function showPlacesByCategory(category) {
    var currentCenter = map.getCenter();
    var googleCategory = [];
    
    switch (category) {
        case 'restaurants':
            googleCategory.push('restaurant');
            break;
        case 'drinks':
            googleCategory.push('bar');
            break;
        case 'parks':
            googleCategory.push('park');
            break;
        case 'culture':
            googleCategory.push('museum');
            break;
        case 'shops':
            googleCategory.push('clothing_store');
            break;
    }

    var request = {
        location: currentCenter,
        radius: 100000,
        type: googleCategory
    }

    service.nearbySearch(request, placeMarkersCallback);
    
}

function displayRoute() {
    directionsRenderer.setMap(map);
    var waypointsLocations = [];
    console.log(waypoints)
    waypoints.forEach(w => {
        waypointsLocations.push({
            location: w.name
        });
    });
    directionsService.route({
        origin: {query: origin.name},
        destination: {query: destination.name},
        waypoints: waypointsLocations,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidTolls: true,
    }, function(response, status) {
          if (status == 'OK') {
            directionsRenderer.setDirections(response);
            google.maps.event.trigger(map, 'resize');
          }
        }
    );
}

categoriesButtons.forEach(category => {
    category.addEventListener('click', () => {
        showPlacesByCategory(category.id);
    })
});

generateRouteButton.addEventListener('click', () => {
    displayRoute();
});

function unlockToolbox() {  
    Array.from(toolbox.children).forEach(button => {
        button.style.cursor = 'pointer';
        button.style.background = '#fff';
    });  
}

function lockToolbox() {
    Array.from(toolbox.children).forEach(button => {
        button.style.cursor = 'not-allowed';
        button.style.background = '#cdcdcd';
    });
}

clearMarkersButton.addEventListener('click', () => {
    marker.setMap(null);
    removeMarkers();
});

setAsOriginButton.addEventListener('click', () => {
    origin = {
        name: markerAddress,
        lat: marker.position.lat,
        lng: marker.position.lng
    }
    plannerOrigin = document.getElementById('origin-container');
    var originText;
    if (plannerOrigin.children[1]) {
        originText = document.getElementById('origin-input');
    } else {
        originText = document.createElement('input');
        originText.setAttribute('type', 'text');
        originText.setAttribute('id', 'origin-input');
        originText.addEventListener('change', () => {
            origin.name = originText.value;
        });
    }
    originText.setAttribute('value', origin.name);
    plannerOrigin.appendChild(originText);
    
});

setAsWaypointButton.addEventListener('click', () => {
    var waypoint = {
        name: markerAddress,
        lat: marker.position.lat,
        lng: marker.position.lng
    }
    plannerWaypoints = document.getElementById('waypoints-container');
    
    var repeatedWaypoint = false;
    console.log(plannerWaypoints.children)
    if (plannerWaypoints.children) {
        Array.from(plannerWaypoints.children).forEach(w => {
            if (w.children[0].value === waypoint.name) {
                repeatedWaypoint = true;
            }
        });    
    }

    console.log(repeatedWaypoint)
    if (!repeatedWaypoint) {
        var waypointDiv = document.createElement("div");
        var waypointSVG = document.createElement('object');
        waypointSVG.setAttribute('data', '/assets/waypoint.svg');
        waypointSVG.setAttribute('width', '15');
        waypointSVG.setAttribute('height', '15');
        var waypointText = document.createElement("input");
        waypointText.setAttribute('type', 'text');
        waypointText.setAttribute('value', waypoint.name);
        waypointDiv.classList.add('waypoint');
        waypointDiv.appendChild(waypointSVG);  
        waypointDiv.appendChild(waypointText);
        plannerWaypoints.appendChild(waypointDiv);
        waypoints.push(waypoint);     
    }
  
});

setAsDestinationButton.addEventListener('click', () => {
    destination = {
        name: markerAddress,
        lat: marker.position.lat,
        lng: marker.position.lng
    }
    plannerDestination = document.getElementById('destination-container');
    if (plannerDestination.children[1]) {
        var destinationText = document.getElementById("destination-input");
    } else {
        var destinationText = document.createElement("input");
        destinationText.setAttribute('type', 'text');
        destinationText.setAttribute('id', 'destination-input');
        destinationText.addEventListener('change', () => {
            destination.name = destinationText.value;
        });
    }
    destinationText.setAttribute('value', destination.name);
    plannerDestination.appendChild(destinationText);        
});

clearRoute.addEventListener('click', () => {
    directionsRenderer.setMap(null);

    plannerOrigin = document.getElementById('origin-container');
    plannerWaypoints = document.getElementById('waypoints-container');
    plannerDestination = document.getElementById('destination-container');

    if (plannerOrigin.children[1]) {
        plannerOrigin.children[1].remove();
    }
    if (plannerWaypoints.children) {
        Array.from(plannerWaypoints.children).forEach(w => {
            w.remove();
        });
    }
    if (plannerDestination.children[1]) {
        plannerDestination.children[1].remove();
    }
    origin = undefined;
    waypoints = [];
    destination = undefined;    
});

/*
    Queda por hacer:
    - Obtener la localización del usuario
    - Añadir CSS a título, filtros, ruta, botones de ruta
    - Escuchar click en Generate Route y generar la ruta en el mapa

    - Almacenamiento
*/