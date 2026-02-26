<script setup>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { query, collection, onSnapshot } from "firebase/firestore";
import { db } from '../firebase';
import { getCurrentUser } from '../authenticateUser';
import { donatingCatIcon, receivingCatIcon } from './icons/LeafletIcon'
import { addPetCoords } from '../addPetCoords'

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
const mapInteractionEnabled = ref(false);
let markersUnsubscribe = null;
const interactionKeyLabel = ref('Ctrl');

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
}

function initializeMap() {
    mymap = L.map('main_map', {
        zoomControl: true,
    }).setView([4.225128, 102.249195], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(mymap);

    // Register the function so that it activates when the user clicks on the map
    mymap.on('click', onMapClick);
}

function updateInteractionModifierState(event) {
    mapInteractionEnabled.value = event.ctrlKey || event.metaKey;
}

function resetInteractionModifierState() {
    mapInteractionEnabled.value = false;
}

onMounted(() => {
    if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)) {
        interactionKeyLabel.value = 'Cmd';
    }

    initializeMap()
    window.addEventListener('keydown', updateInteractionModifierState);
    window.addEventListener('keyup', updateInteractionModifierState);
    window.addEventListener('blur', resetInteractionModifierState);

    // Query the data from Firestore, then plot it on the map with Leaflet icons
    const markersQuery = query(collection(db, "pet-coords"));

    markersUnsubscribe = onSnapshot(markersQuery, (querySnapshot) => {
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

            let chosenIcon

            if (doc.data().donate) {
                chosenIcon = donatingCatIcon
            } else {
                chosenIcon = receivingCatIcon
            }

            let newMarker = new L.marker([doc.data().coords[0], doc.data().coords[1]], { icon: chosenIcon }).bindPopup(`${doc.data().donate ? 'I am donating' : 'I am looking for'} cats!<br>Adress: ${doc.data().addressName}<br>Name: ${creatorName}<br>Phone Number: ${creatorPhone}<br><img src="${petImage}" style="width: 84px; height: 84px; border-radius: 50%">`);

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

    let createThing = document.getElementById('createThing')

    if (createThing) {
        createThing.onclick = () => {
            const currentUser = getCurrentUser()

            if (!currentUser) {
                console.warn('Cannot create listing because no authenticated user is available.')
                return
            }

            addPetCoords(mymap.getCenter().lat, mymap.getCenter().lng, currentUser.uid);

        }
    }


})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', updateInteractionModifierState);
    window.removeEventListener('keyup', updateInteractionModifierState);
    window.removeEventListener('blur', resetInteractionModifierState);

    if (markersUnsubscribe) {
        markersUnsubscribe()
    }
})

</script>

<template>
    <div class="map-shell">
        <p class="map-lock-hint">
            Hold {{ interactionKeyLabel }} to interact with the map.
        </p>
        <div class="map-frame" :class="{ 'is-locked': !mapInteractionEnabled }">
            <div id="main_map"></div>
            <div
                v-if="!mapInteractionEnabled"
                class="map-lock-overlay"
                @wheel.prevent.stop
                @mousedown.prevent.stop
                @dblclick.prevent.stop
                @touchstart.prevent.stop
                @pointerdown.prevent.stop
                @click.prevent.stop
            />
        </div>
    </div>
</template>

<style scoped>
.map-shell {
    position: relative;
}

.map-lock-hint {
    position: absolute;
    top: 1.5vh;
    left: 7vh;
    z-index: 1000;
    margin: 0;
    padding: 0.4rem 0.7rem;
    border-radius: 6px;
    background-color: rgba(0, 0, 0, 0.72);
    color: #ffffff;
    font-size: 0.85rem;
    line-height: 1.2;
}

.map-frame {
    position: relative;
    margin: 5vh;
}

#main_map {
    height: 75vh;
    padding-bottom: 10vh;
    z-index: 0;
}

.map-lock-overlay {
    position: absolute;
    inset: 0;
    z-index: 900;
    background: transparent;
}

.map-frame.is-locked :deep(.leaflet-control-zoom) {
    display: none;
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
