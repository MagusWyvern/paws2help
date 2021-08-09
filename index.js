var userlatitude = 0;
var userlongitude = 0;
var mymap = 0;



function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert('500 Error');
    }
}

function reloadNewMap() {

    mymap = L.map('mapid').setView([userlatitude, userlongitude], 13);
    console.log(userlatitude)
    

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoibWFndXN3eXZlcm4iLCJhIjoiY2tzNGFweDNrMDFpMzJwbWxpZmlmMHhmciJ9.Itc6X_zrrrRfUj7GwwXP8w'
    }).addTo(mymap);
    
    var marker = L.marker([2.734557, 101.951923]);
    
    var circle = L.circle([2.707465, 101.946087], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 500
    }).addTo(mymap);
    
    // var polygon = L.polygon([
    //     [2.742101, 101.907806],
    //     [2.703007, 101.89579],
    //     [2.720668, 101.885662]
    // ]).addTo(mymap);
    
    marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
    circle.bindPopup("Stray cats around this area.");
    // polygon.bindPopup("I am a polygon.");
    
    var popup = L.popup();
    
    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(mymap);
    }
    
    mymap.on('click', onMapClick);
    
    var dogIcon = L.icon({
        iconUrl: 'dog-solid.svg',
        shadowUrl: 'shadow.svg',
    
        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    
    var catIcon = L.icon({
        iconUrl: 'cat-solid.svg',
        shadowUrl: 'shadow.svg',
    
        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    
    var birdIcon = L.icon({
        iconUrl: 'dove-solid.svg',
        shadowUrl: 'shadow.svg',
    
        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    
    var helpIcon = L.icon({
        iconUrl: 'paw-solid.svg',
        shadowUrl: 'shadow.svg',
    
        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    
    L.marker([2.734557, 101.951923], { icon: helpIcon }).addTo(mymap).bindPopup("Klinik Veterinar XYZ Seremban is offering help.");
    
    L.marker([2.730442, 101.929092], { icon: catIcon }).addTo(mymap).bindPopup("Pn. Aminah is donating cats.");
    
    L.marker([2.733357, 101.925316], { icon: catIcon }).addTo(mymap).bindPopup("En. Adam is looking for cats.");
    
    L.marker([2.713638, 101.965141], { icon: dogIcon }).addTo(mymap).bindPopup("Ms. Cheoo is donating dogs.");
    
    L.marker([2.710209, 101.926174], { icon: birdIcon }).addTo(mymap).bindPopup("En. Adam is looking for birds.");
}

function showPosition(position) {

    userlatitude = position.coords.latitude;
    userlongitude = position.coords.longitude;
    console.log(position.coords.latitude);
    console.log(position.coords.longitude);


}










