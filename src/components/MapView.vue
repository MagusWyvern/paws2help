<script setup>
import "leaflet/dist/leaflet.js";
import "leaflet/dist/leaflet.css";
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { ref, onMounted } from 'vue';
import { initializeApp } from "firebase/app";
import { getFirestore, query, collection, onSnapshot, doc, setDoc } from "firebase/firestore";
// dec2hex :: Integer -> String
// i.e. 0-255 -> '00'-'ff'
function dec2hex (dec) {
  return dec.toString(16).padStart(2, "0")
}

// generateId :: Integer -> String
function generateId (len) {
  var arr = new Uint8Array((len || 40) / 2)
  window.crypto.getRandomValues(arr)
  return Array.from(arr, dec2hex).join('')
}

console.log(generateId())
// "82defcf324571e70b0521d79cce2bf3fffccd69"

console.log(generateId(20))
// "c1a050a4cd1556948d41"
let mymap
let petImage
let creatorPhone
let creatorName
var markerClusters = L.markerClusterGroup()
var dogIcon = L.icon({
    iconUrl: '/map-icons/dog-solid.svg',
    shadowUrl: '/map-icons/shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var birdIcon = L.icon({
    iconUrl: '/map-icons/dove-solid.svg',
    shadowUrl: '/map-icons/shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var helpIcon = L.icon({
    iconUrl: '/map-icons/paw-solid.svg',
    shadowUrl: '/map-icons/shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [10, -30] // point from which the popup should open relative to the iconAnchor
});

var catIcon = L.icon({
    iconUrl: '/map-icons/cat-solid.svg',
    shadowUrl: '/map-icons/shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [10, -30] // point from which the popup should open relative to the iconAnchor
});

var markers = new Array();

var firebaseConfig = {
    apiKey: "AIzaSyCxuDGiS-uw2G3Y6keIW85G8v25IeRTaBs",
    authDomain: "petscircle.firebaseapp.com",
    projectId: "petscircle",
    storageBucket: "petscircle.appspot.com",
    messagingSenderId: "195232543538",
    appId: "1:195232543538:web:f5fbb5300ffd876b325d2b",
    measurementId: "G-3PVKXCEFW3"
};

const firebaseApp = initializeApp({
    apiKey: "AIzaSyCxuDGiS-uw2G3Y6keIW85G8v25IeRTaBs",
    authDomain: "petscircle.firebaseapp.com",
    projectId: "petscircle",
    storageBucket: "petscircle.appspot.com",
    messagingSenderId: "195232543538",
    appId: "1:195232543538:web:f5fbb5300ffd876b325d2b",
    measurementId: "G-3PVKXCEFW3"
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

let userlatitude = 0;
let userlongitude = 0;
let position = {
    coords:
    {
        lat: 0,
        lng: 0
    }
}

// Options parameter for user geolocation
let options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

var popup = L.popup();

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
}


function initializeMap() {
    mymap = L.map('main_map').setView([4.225128, 102.249195], 8);

    console.log("here" + mymap)

    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoibWFndXN3eXZlcm4iLCJhIjoiY2tzNGFweDNrMDFpMzJwbWxpZmlmMHhmciJ9.Itc6X_zrrrRfUj7GwwXP8w',
    }).addTo(mymap);

    // Register the function so that it activates when the user clicks on the map
    mymap.on('click', onMapClick);
}

onMounted(() => {

    initializeMap()

    // Query the data from Firestore, then plot it on the map with Leaflet icons

    const markersQuery = query(collection(db, "pet-coords"));

    const unsubscribe = onSnapshot(markersQuery, (querySnapshot) => {
        const cities = [];

        querySnapshot.forEach((doc) => {

            console.log(JSON.stringify(doc.data()))

            cities.push(doc.data().addressName)

            if (doc.data().petImage == undefined) {
                petImage = "../assets/logo.svg"
            } else {
                petImage = doc.data().petImage
            };

            if (doc.data().creatorName == undefined) {
                creatorName = "Anonymous"
            } else {
                creatorName = doc.data().creatorName
            }

            if (doc.data().creatorPhone == undefined) {
                creatorPhone = "No phone number provided"
            } else {
                creatorPhone = doc.data().creatorPhone
            }

            let newMarker = new L.marker([doc.data().coords[0], doc.data().coords[1]], { icon: catIcon }).bindPopup(`${doc.data().donate ? 'I am donating' : 'I am looking for'} cats!<br>Adress: ${doc.data().addressName}<br>Name: ${creatorName}<br>Phone Number: ${creatorPhone}<br><img src="${petImage}" style="width: 84px; height: 84px; border-radius: 50%">`);

            if (markers.includes(newMarker) == false) {
                markers.push(newMarker);
            } else {
                console.info('Marker already exists');
            }
        });


        for (let i = 0; i < markers.length; i++) {
            mymap.addLayer(markers[i])
        }

        console.info('Current markers array length: ' + markers.length)
        console.log("Loaded address names: ", cities.join(", "));

    });

    function addPetCoords() {

        // Use the server timestamp instead of client so that the data stays consistent

        let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${mymap.getCenter().lat}&lon=${mymap.getCenter().lng}&zoom=18&addressdetails=1`;

        // Debugging
        // console.info('URL to fetch: ' + url);
        // console.info('Latitude to fetch:' + mymap.getCenter().lat);
        // console.info('Longitude to fetch:' + mymap.getCenter().lng);

        let addressDisplayName

        fetch(url).then(response => response.json()).then(data => { addressDisplayName = data.display_name });

        console.info('Address: ' + addressDisplayName);

        setDoc(doc(db, "pet-coords", generateId(20)), {
            coords: [mymap.getCenter().lat, mymap.getCenter().lng],
            uid: user.uid,
            donate: document.getElementById('donate').checked,
            createdAt: serverTimestamp(),
            addressName: addressDisplayName,
            creatorName: document.getElementById('creatorName').value,
            creatorPhone: document.getElementById('creatorPhone').value,
            petImage: document.getElementById('petImage').value,
        });

        // Clear the form

        document.getElementById('creatorName').value = '';
        document.getElementById('creatorPhone').value = '';
        document.getElementById('petImage').value = '';
        document.getElementById('donate').checked = false;
    }

    function deleteDocbyID(button) {
        // Delete a coordinate using the id of the x icon
        id = button.getAttribute('data-docid');

        // Get the coords from the doc id 
        var docIDToDelete = petCoordsRef.doc(id).get();

        // Loop through the markers array and find the marker that matches the coords of the document
        for (let i = 0; i < markers.length; i++) {
            if (markers[i]._latlng.lat == docIDToDelete.data().coords[0] && markers[i]._latlng.lng == docIDToDelete.data().coords[1]) {

                // Remove the marker from the map
                markerClusters.removeLayer(markers[i])

                // Remove the marker from the array
                markers.splice(i, 1);
                break;
            }
        }

        // Finally, delete the document
        petCoordsRef.doc(id).delete();


    }

    let createThing = document.getElementById('createThing')

    createThing.onclick = () => {

        addPetCoords();

    }


})


</script>

<template>

    <div id="main_map">

    </div>

</template>

<style scoped>
#main_map {
    height: 75vh;
    padding-bottom: 10vh;
    z-index: 0;
    margin: 5vh;
}

.leaflet-cluster-anim .leaflet-marker-icon,
.leaflet-cluster-anim .leaflet-marker-shadow {
    -webkit-transition: -webkit-transform 0.3s ease-out, opacity 0.3s ease-in;
    -moz-transition: -moz-transform 0.3s ease-out, opacity 0.3s ease-in;
    -o-transition: -o-transform 0.3s ease-out, opacity 0.3s ease-in;
    transition: transform 0.3s ease-out, opacity 0.3s ease-in;
}

.leaflet-cluster-spider-leg {
    /* stroke-dashoffset (duration and function) should match with leaflet-marker-icon transform in order to track it exactly */
    -webkit-transition: -webkit-stroke-dashoffset 0.3s ease-out, -webkit-stroke-opacity 0.3s ease-in;
    -moz-transition: -moz-stroke-dashoffset 0.3s ease-out, -moz-stroke-opacity 0.3s ease-in;
    -o-transition: -o-stroke-dashoffset 0.3s ease-out, -o-stroke-opacity 0.3s ease-in;
    transition: stroke-dashoffset 0.3s ease-out, stroke-opacity 0.3s ease-in;
}
</style>
