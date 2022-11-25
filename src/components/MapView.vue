<script setup>
import "leaflet/dist/leaflet.js";
import "leaflet/dist/leaflet.css";
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { ref, onMounted } from 'vue';
import { initializeApp } from "firebase/app";
import { getFirestore, query, collection, onSnapshot, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getCurrentUser } from '../authenticateUser'
import { catIcon } from './icons/LeafletIcon'
import { addPetCoords } from '../addPetCoords'

const firebaseConfig = {
    apiKey: "AIzaSyCxuDGiS-uw2G3Y6keIW85G8v25IeRTaBs",
    authDomain: "petscircle.firebaseapp.com",
    projectId: "petscircle",
    storageBucket: "petscircle.appspot.com",
    messagingSenderId: "195232543538",
    appId: "1:195232543538:web:f5fbb5300ffd876b325d2b",
    measurementId: "G-3PVKXCEFW3"
};

const firebaseApp = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(firebaseApp);

let mymap
let petImage
let creatorPhone
let creatorName

var markerClusters = L.markerClusterGroup()
var markers = new Array();

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

    let user = getCurrentUser()

    // Query the data from Firestore, then plot it on the map with Leaflet icons
    const markersQuery = query(collection(db, "pet-coords"));

    const unsubscribe = onSnapshot(markersQuery, (querySnapshot) => {
        const cities = [];

        querySnapshot.forEach((doc) => {

            // Logging: Log every document fetched in their raw object form
            // console.log(JSON.stringify(doc.data()))

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

        // Loggging
        // console.info('Current markers array length: ' + markers.length)
        // console.log("Loaded address names: ", cities.join(", "));

    });



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
        
        addPetCoords(mymap.getCenter().lat, mymap.getCenter().lng, getCurrentUser().uid);

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
