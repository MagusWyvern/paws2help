var userlatitude = 0;
var userlongitude = 0;
var mymap = 0;

function getLocation() {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

function loadMap() {

    mymap = L.map('mapid').setView([userlatitude, userlongitude], 15);
    
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoibWFndXN3eXZlcm4iLCJhIjoiY2tzNGFweDNrMDFpMzJwbWxpZmlmMHhmciJ9.Itc6X_zrrrRfUj7GwwXP8w'
    }).addTo(mymap);

    // Circle marker, used for stray animals
    
    var circle = L.circle([2.707465, 101.946087], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 100
    }).addTo(mymap);
    
    circle.bindPopup("Stray cats around this area.");
    
    var popup = L.popup();

    // Debugging coords, comment out this section of code for production
    
    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(mymap);
    }
    
    mymap.on('click', onMapClick);

    // Initialize the custom icons
    
    var dogIcon = L.icon({
        iconUrl: './map-icons/dog-solid.svg',
        shadowUrl: 'shadow.svg',
    
        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    
    var catIcon = L.icon({
        iconUrl: './map-icons/cat-solid.svg',
        shadowUrl: 'shadow.svg',
    
        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    
    var birdIcon = L.icon({
        iconUrl: './map-icons/dove-solid.svg',
        shadowUrl: 'shadow.svg',
    
        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    
    var helpIcon = L.icon({
        iconUrl: './map-icons/paw-solid.svg',
        shadowUrl: 'shadow.svg',
    
        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });

    // Add the markers to the map

    // Veterinar clinics
    
    L.marker([2.734557, 101.951923], { icon: helpIcon }).addTo(mymap).bindPopup("Klinik Veterinar XYZ Seremban is offering help.");

    L.marker([5.399737, 101.678467], { icon: helpIcon }).addTo(mymap).bindPopup("Klinik Veterinar XYZ Seremban is offering help.");   

    // Cats
    
    L.marker([5.182659, 100.942383], { icon: catIcon }).addTo(mymap).bindPopup("Pn. Aminah is donating cats.");
    
    L.marker([2.320514, 103.117676], { icon: catIcon }).addTo(mymap).bindPopup("En. Adam is looking for cats.");

    L.marker([3.734101, 102.365112], { icon: catIcon }).addTo(mymap).bindPopup("En. Adam is looking for cats.");

    // Dogs
    
    L.marker([4.985423, 102.414551], { icon: dogIcon }).addTo(mymap).bindPopup("Ms. Cheoo is donating dogs.");

    L.marker([4.29493, 102.282715], { icon: dogIcon }).addTo(mymap).bindPopup("Ms. Cheoo is donating dogs.");

    // Birds
    
    L.marker([4.174806, 101.535645], { icon: birdIcon }).addTo(mymap).bindPopup("En. Adam is looking for birds.");

    L.marker([4.448272, 102.689209], { icon: birdIcon }).addTo(mymap).bindPopup("En. Adam is looking for birds.");


    L.marker([userlatitude, userlongitude]).addTo(mymap).bindPopup("You are here!");
}

function showPosition(position) {

    userlatitude = position.coords.latitude;
    userlongitude = position.coords.longitude;

    // Debugging
    // console.log(position.coords.latitude);
    // console.log(position.coords.longitude);

    loadMap();

}

// Get user location on arrival
getLocation();

// Handle PWA installation

let deferredPrompt;
const addBtn = document.querySelector('#add-button');
addBtn.style.display = 'none';

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    addBtn.style.display = 'block';
  
    addBtn.addEventListener('click', (e) => {
      // hide our user interface that shows our A2HS button
      addBtn.style.display = 'none';
      // Show the prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
          } else {
            console.log('User dismissed the A2HS prompt');
          }
          deferredPrompt = null;
        });
    });
  });








