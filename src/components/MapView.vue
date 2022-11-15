<script setup>
import 'leaflet/dist/leaflet.js'
import "leaflet/dist/leaflet.css";
import { ref, onMounted } from 'vue'
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { getAuth, onAuthStateChanged, getRedirectResult } from 'firebase/auth';

const firebaseApp = initializeApp({
  apiKey: "AIzaSyCxuDGiS-uw2G3Y6keIW85G8v25IeRTaBs",
  authDomain: "petscircle.firebaseapp.com",
  projectId: "petscircle",
  storageBucket: "petscircle.appspot.com",
  messagingSenderId: "195232543538",
  appId: "1:195232543538:web:f5fbb5300ffd876b325d2b",
  measurementId: "G-3PVKXCEFW3"
});

const auth = getAuth(firebaseApp);
// const db = getFirestore(app);

let userlatitude = 0;
let userlongitude = 0;
let mymap
let position = {
    coords:
    {
        lat: 0,
        lng: 0
    }
}

let popup = L.popup();

// Options parameter for user geolocation
let options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

let dogIcon = L.icon({
    iconUrl: './map-icons/dog-solid.svg',
    shadowUrl: './map-icons/shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

let birdIcon = L.icon({
    iconUrl: './map-icons/dove-solid.svg',
    shadowUrl: './map-icons/shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

let helpIcon = L.icon({
    iconUrl: './map-icons/paw-solid.svg',
    shadowUrl: './map-icons/shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [10, -30] // point from which the popup should open relative to the iconAnchor
});

let catIcon = L.icon({
    iconUrl: './map-icons/cat-solid.svg',
    shadowUrl: './map-icons/shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [10, -30] // point from which the popup should open relative to the iconAnchor
});

onMounted(() => {
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
})


function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
}
let petCoordsRef = db.collection('pet-coords')

publicMarkerSubscribe = petCoordsRef

    
    // Queries the firestore API for a snapshot of the documents
    // Updates on any document change

    .onSnapshot(querySnapshot => {

        markers = new Array()
        markerClusters = L.markerClusterGroup()

        querySnapshot.docs.map(docs => {

            // If the user didn't specify any values, give a fallback value 

            if (docs.data().petImage == undefined) {
                petImage = "./map-icons/blank-cat.jpg"
            } else {
                petImage = docs.data().petImage

            }

            if (docs.data().creatorName == undefined) {
                creatorName = "Anonymous"
            } else {
                creatorName = docs.data().creatorName
            }

            if (docs.data().creatorPhone == undefined) {
                creatorPhone = "No phone number provided"
            } else {
                creatorPhone = docs.data().creatorPhone
            }

            let newMarker = new L.marker([docs.data().coords[0], docs.data().coords[1]], { icon: catIcon }).bindPopup(`${docs.data().donate ? 'I am donating' : 'I am looking for'} cats!<br>Adress: ${docs.data().addressName}<br>Name: ${creatorName}<br>Phone Number: ${creatorPhone}<br><img src="${petImage}" style="width: 84px; height: 84px; border-radius: 50%">`);


            // Debugging
            // console.log(newMarker)
            // console.log(markers.includes(newMarker))

            // Compare the new marker against every marker in the array

            if (markers.includes(newMarker) == false) {
                markers.push(newMarker);
                // markerClusters.addLayer(newMarker);
            } else {
                console.info('Marker already exists');
            }

        });

        for (let i = 0; i < markers.length; i++) {
            if (markerClusters.hasLayer(markers[i]) == false) {
                markerClusters.addLayer(markers[i])
            } else {
                console.info('Marker already in cluster')
            }
        }

        mymap.addLayer(markerClusters)

        console.info('Current markers array length: ' + markers.length)

    });

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
</style>
