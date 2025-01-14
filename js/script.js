let map, userLocation, parkingData = [];
let markers = []; // Parking markers and polygons
let currentRadius = 1.00; // Initial search radius in km
let radiusShader = undefined;  // L.Donut for search radius


// Get the user's location, find and show parking areas nearby
function main() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showMap, showLocationError);
    } else {
        alert("Geolocation wird von diesem Browser nicht unterstützt.");
    }
}

function showLocationError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("Standort nicht gefunden: Diese Website benötigt die Erlaubnis zum Standortzugriff.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Standort nicht gefunden: Ihre Standortinformationen sind nicht verfügbar.");
            break;
        case error.TIMEOUT:
            alert("Timeout: Die Standortermittlung konnte nicht schnell genug abgeschlossen werden.");
            break;
        default:
            alert("Standort nicht gefunden: Ein unbekannter Fehler ist aufgetreten.");
            break;
    }
}

function showMap(position) {

    // On mobile, start with menu and sidebar closed
    if (isMobile()) {
        toggleSidebar();
        toggleMenu();
    }

    userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    initMap(userLocation);
    loadParking(userLocation.lat, userLocation.lng);
}


// Initialize the map
function initMap(location) {
    map = L.map('map', {
        contextmenu: true,
        contextmenuWidth: 140,
        contextmenuItems: [{
            text: 'Standort hier setzen',
            callback: setUserPositionManually
        }, {
            text: 'Karte hier zentrieren',
            callback: centerMap
        }]
    });

    map.setView([location.lat, location.lng], 15);

    map.whenReady(() => {document.getElementById("loading-screen").style.display = 'none'});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18
    }).addTo(map);

    L.marker([location.lat, location.lng]).addTo(map)
        .bindPopup("Dein Standort")
        .openPopup();
    
    map.on('click', () => {
        document.querySelectorAll("[data-item-id]").forEach((elem) => {elem.classList.remove('parking-item-selected')});
    });
    
}

function setUserPositionManually (e) {
    userLocation.lat = e.latlng.lat;
    userLocation.lng = e.latlng.lng;
    loadParking(userLocation.lat, userLocation.lng);
}

function centerMap (e) {
	map.panTo(e.latlng);
}


// Pan to a point on the map, with offset.
// https://gis.stackexchange.com/questions/218102/how-do-i-zoom-pan-to-a-leaflet-map-such-that-the-given-point-is-off-center
L.Map.prototype.panToOffset = function (latlng, offset, options) {
    var x = this.latLngToContainerPoint(latlng).x - offset[0]
    var y = this.latLngToContainerPoint(latlng).y - offset[1]
    var point = this.containerPointToLatLng([x, y])
    return this.setView(point, this._zoom, { pan: options })
}

// Fetch parking data from OpenStreetMap and call visualization function
async function loadParking(lat, lng) {
    const radiusInMeters = currentRadius * 1000; // Convert km to meters

    const query = `nwr[amenity=parking](around:${radiusInMeters},${lat},${lng});`;
    const apiUrl = `https://overpass-api.de/api/interpreter?data=[out:json];(${query});out geom;`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        parkingData = data.elements;
    } catch (error) {
        console.error("Fehler beim Laden der Parkplatzdaten:", error);
        alert("Parkplatzdaten konnten nicht geladen werden.");
    }
    try {
        updateParking();
    }   catch (error) {
        console.error("Fehler beim Update der Karte:", error);
        alert("Daten konnten nicht fehlerfrei visualisiert werden.");
    }
}


// Add current parking data to map and sidebar list
function updateParking() {
    clearResults();
    extractCoordinatesFromRawParkingData();
    sortParkingDataByDistanceFromUser();
    _addParkingDataToMapAndResultList();
}

function clearResults() {
    clearMap();
    showUserLocationOnMap();
    clearResultList();
}

// Remove existing markers and polygons from the map
function clearMap() {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Polygon || layer instanceof L.Donut) {
            map.removeLayer(layer);
        }
    });

    markers = [];
}

// Empty the sidebar result list
function clearResultList() {
    const parkingList = document.getElementById('parking-list');
    parkingList.innerHTML = '';
}

function showUserLocationOnMap() {
    L.marker([userLocation.lat, userLocation.lng]).addTo(map)
        .bindPopup("Dein Standort")
        .openPopup();
}

// Darken the map outside the search radius
function addRadiusShaderToMap(map) {
    radiusShader = L.donut([userLocation.lat,userLocation.lng],{
        // Earth circumference
        radius: 40076000,
        // Search radius
        innerRadius: currentRadius*1000,
        innerRadiusAsPercent: false,
        color: '#000',
        weight: 0,
        // Make the shader a part of the background
        interactive: false,
    }).addTo(map);
}

// Compute a single set of coordinates for each result and store it in parkingData
function extractCoordinatesFromRawParkingData() {
    parkingData.forEach(item => {
        let latLng = null;
        if (item.type === "node") {
            latLng = [item.lat, item.lon];
        } else if (item.type === "way" && item.geometry) {
            const latLngs = item.geometry.map(geo => [geo.lat, geo.lon]);
            latLng = latLngs[0];
        } else if (item.type === "relation" && item.members) {
            const memberLatLngs = item.members.filter(member => member.type === "node" && member.lat !== undefined && member.lon !== undefined).map(member => [member.lat, member.lon]);
            latLng = memberLatLngs[0];
        } else {
            console.error("unknown item type");
        }
        item.coordinate = latLng;
    });
    // Filter bad results
    parkingData = parkingData.filter((item) => {
        return item.coordinate != undefined;
    });
}

// Sort the results
function sortParkingDataByDistanceFromUser() {
    parkingData.forEach((item) => {
        // Compute distance in meters
        const itemCoords = {latitude: item.coordinate[0], longitude: item.coordinate[1]};
        const userCoords = {latitude: userLocation.lat, longitude: userLocation.lng};
        const dist = calcDistance(itemCoords, userCoords) * 1000;
        item.distanceFromUser = dist;
    });

    parkingData.sort((itemA, itemB) => {
        return itemA.distanceFromUser - itemB.distanceFromUser;
    });
}

// Add the previously polished and sorted parking data to map and sidebar
function _addParkingDataToMapAndResultList() {
    parkingData.forEach(item => {
        if (!shouldShowParking(item.tags)) return;

        const color = getParkingColor(item.tags);
        const popupText = generatePopupText(item, color);
        if (item.type === "node") {
            // Add point data as marker
            const markerIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color:${color}; width:15px; height:15px; border-radius:50%; border: 2px solid white;"></div>`,
                iconSize: [15, 15]
            });
            const latLng = [item.lat, item.lon];
            const marker = L.marker(latLng, { icon: markerIcon });
            marker.addTo(map).bindPopup(popupText);
            marker.on('click', () => {popupClicked(item)});
            addListItem(item, latLng, marker);
        } else if (item.type === "way" && item.geometry) {
            // Add area data as polygon
            const latLngs = item.geometry.map(geo => [geo.lat, geo.lon]);
            const polygon = L.polygon(latLngs, { color: color, fillOpacity: 0.5 });
            polygon.addTo(map).bindPopup(popupText);
            polygon.on('click', () => {popupClicked(item)});
            addListItem(item, latLngs[0], polygon);
        } else if (item.type === "relation" && item.members) {
            // Add relation data as polygon
            const memberLatLngs = item.members.filter(member => member.type === "node" && member.lat !== undefined && member.lon !== undefined).map(member => [member.lat, member.lon]);
            if (memberLatLngs.length > 0) {
                const popupText = generatePopupText(item, color);
                const polygon = L.polygon(memberLatLngs, { color: color, fillOpacity: 0.5 })
                polygon.addTo(map).bindPopup(popupText);
                polygon.on('click', () => {popupClicked(item)});
                addListItem(item, memberLatLngs[0], polygon);
            }
        }
    });

    addRadiusShaderToMap(map);
}


// Scroll to and select the matching sidebar entry for clicked-on item
function popupClicked(item) {
    if (isMobile() || !isSidebarVisible()) {return;}
    const listItemDiv = document.querySelector(`[data-item-id=\"${item.id}\"]`);
    listItemDiv.scrollIntoView({behavior: "smooth"});
    document.querySelectorAll("[data-item-id]").forEach((elem) => {elem.classList.remove('parking-item-selected')});
    listItemDiv.classList.add('parking-item-selected');
}


function updateRadius() {
    const radiusSlider = document.getElementById('radius-slider');
    currentRadius = parseFloat(radiusSlider.value);
    if (userLocation) {
        loadParking(userLocation.lat, userLocation.lng);
    }
}

function showRadiusValue() {
    const radiusValue = document.getElementById('radius-value');
    const radiusSlider = document.getElementById('radius-slider');
    radiusValue.textContent = parseFloat(radiusSlider.value).toFixed(2);
}



// Decide whether to show a result, based on the applied checkbox filters
function shouldShowParking(tags) {
    const freeChecked = document.getElementById('filter-free').checked;
    const customersChecked = document.getElementById('filter-customers').checked;
    const paidCustomersChecked = document.getElementById('filter-paid-customers').checked;
    const paidChecked = document.getElementById('filter-paid').checked;
    const permissiveChecked = document.getElementById('filter-permissive').checked;
    const otherChecked = document.getElementById('filter-other').checked;
    const privateChecked = document.getElementById('filter-private').checked;
    const residentsChecked = document.getElementById('filter-residents').checked;

    if (tags.access === "yes" && tags.fee === "no" && freeChecked) return true;
    if (tags.access === undefined && tags.fee === "no" && freeChecked) return true;
    if (tags.access === "customers" && (tags.fee === "no" || tags.fee === undefined) && customersChecked) return true;
    if (tags.access === "customers" && tags.fee === "yes" && paidCustomersChecked) return true;
    if (tags.fee === "yes" && paidChecked && tags.access !== "customers") return true;
    if (tags.access === "permissive" && permissiveChecked) return true;
    if (tags.access === "private" && privateChecked) return true;
    if (tags.access === "residents" && residentsChecked) return true;
    if (otherChecked && tags.access != "private" && tags.access != "residents" && tags.access != "permissive" && tags.access != "customers") {
        if (tags.fee === undefined || tags.access === undefined) return true;
    }
    return false;
}

// Build the sidebar result list
function addListItem(item, latLng, marker) {
    const parkingList = document.getElementById('parking-list');
    const listItem = document.createElement('div');
    listItem.className = 'parking-item';

    // Set border color based on parking access type
    const borderColor = getParkingColor(item.tags);
    listItem.style.border = `4px solid ${borderColor}`;
    listItem.style.backgroundColor = shadeColor(borderColor, -30);

    // Compute distance in meters from user's location
    const itemCoords = {latitude: latLng[0], longitude: latLng[1]};
    const userCoords = {latitude: userLocation.lat, longitude: userLocation.lng};
    const dist = calcDistance(itemCoords, userCoords) * 1000;

    listItem.innerHTML = `
        <b>${item.tags?.name || 'Unbenannt'}</b><br>
        <b>Zugang:</b> ${item.tags?.access || 'N/A'}<br>
        <b>Gebühr:</b> ${item.tags?.fee || 'N/A'}<br>
        <b>Entfernung:</b> ${dist.toFixed(0)} m
    `;
    listItem.onclick = () => parkingListItemClick(item, marker);
    parkingList.appendChild(listItem);

    listItem.dataset.itemId = item.id;
}


function parkingListItemClick(item, marker) {
    marker.openPopup();
    const offset = map.getPixelBounds().getSize().y / 5;

    map.panToOffset(item.coordinate, [0, offset]);
    const listItemDiv = document.querySelector(`[data-item-id=\"${item.id}\"]`);
    document.querySelectorAll("[data-item-id]").forEach((elem) => {elem.classList.remove('parking-item-selected')});
    listItemDiv.classList.add('parking-item-selected');
}

function isMobile() {
    return window.matchMedia("(max-width: 600px)").matches;
}

// Close sidebar menu to avoid overlapping on switch to mobile screen 
window.addEventListener('resize', function() {
    if (isMobile() && isMenuVisible() && isSidebarVisible()) {
        hideSidebar();
    }
});

// Automatically load data when the page is opened
document.addEventListener('DOMContentLoaded', function() {
    main();  
});
