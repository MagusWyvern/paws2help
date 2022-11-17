<script setup>
import "leaflet/dist/leaflet.js";
import "leaflet/dist/leaflet.css";
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { ref, onMounted } from 'vue';
import { initializeApp } from "firebase/app";
import { getFirestore, query, collection, onSnapshot } from "firebase/firestore";

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
onMounted(() => {
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
    let mymap
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

    // mymap.addLayer(markerClusters)

    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(mymap);
    }

    const q = query(collection(db, "pet-coords"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
        console.log("Loaded address names: ", cities.join(", "));

    });
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

.leaflet-cluster-anim .leaflet-marker-icon, .leaflet-cluster-anim .leaflet-marker-shadow {
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
