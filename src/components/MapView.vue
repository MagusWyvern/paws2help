<script setup>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { query, collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebase';
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
let authUnsubscribe = null;
const interactionKeyLabel = ref('Ctrl');
const isLoggedIn = ref(Boolean(getCurrentUser()));

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
    authUnsubscribe = auth.onAuthStateChanged((user) => {
        isLoggedIn.value = Boolean(user)
    })

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

    const submitStrayReport = document.getElementById('submitStrayReport')
    const reportAnimalType = document.getElementById('reportAnimalType')
    const reportEstimatedCount = document.getElementById('reportEstimatedCount')
    const reportRegion = document.getElementById('reportRegion')
    const reportSubmissionStatus = document.getElementById('reportSubmissionStatus')

    if (submitStrayReport) {
        submitStrayReport.onclick = async () => {
            const currentUser = getCurrentUser()
            if (!currentUser) {
                reportSubmissionStatus.innerHTML = 'Please sign in to submit a report.'
                return
            }

            const animalTypeValue = reportAnimalType.value.trim()
            const estimatedCountValue = Number.parseInt(reportEstimatedCount.value, 10)
            const regionValue = reportRegion.value.trim()
            const mapCenter = mymap.getCenter()

            if (!animalTypeValue || !regionValue || Number.isNaN(estimatedCountValue) || estimatedCountValue < 1) {
                reportSubmissionStatus.innerHTML = 'Fill in animal type, estimated number, and region.'
                return
            }

            try {
                await addDoc(collection(db, 'stray-reports'), {
                    uid: currentUser.uid,
                    animalType: animalTypeValue,
                    estimatedCount: estimatedCountValue,
                    region: regionValue,
                    coords: [mapCenter.lat, mapCenter.lng],
                    createdAt: serverTimestamp(),
                })

                reportAnimalType.value = ''
                reportEstimatedCount.value = ''
                reportRegion.value = ''
                reportSubmissionStatus.innerHTML = 'Report submitted.'
            } catch (error) {
                console.error('Failed to submit stray report:', error)
                reportSubmissionStatus.innerHTML = 'Failed to submit report. Try again.'
            }
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

    if (authUnsubscribe) {
        authUnsubscribe()
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

        <section class="box report-box">
            <h3 class="title is-5">Report Stray Animals</h3>
            <p class="subtitle is-6">Submit a report for the current map region.</p>

            <div v-if="isLoggedIn">
                <div class="field">
                    <label class="label" for="reportAnimalType">Animal type</label>
                    <div class="control">
                        <input id="reportAnimalType" class="input" type="text" placeholder="e.g. Cat, Dog">
                    </div>
                </div>

                <div class="field">
                    <label class="label" for="reportEstimatedCount">Estimated number</label>
                    <div class="control">
                        <input id="reportEstimatedCount" class="input" type="number" min="1" placeholder="e.g. 5">
                    </div>
                </div>

                <div class="field">
                    <label class="label" for="reportRegion">Region description</label>
                    <div class="control">
                        <input id="reportRegion" class="input" type="text" placeholder="e.g. Jalan Melati near the food court">
                    </div>
                </div>

                <button id="submitStrayReport" class="button is-warning">Submit Stray Report</button>
                <p id="reportSubmissionStatus" class="is-size-7 mt-2"></p>
            </div>

            <p v-else class="is-size-7">Sign in to submit stray-animal reports.</p>
        </section>
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
    margin-bottom: 1rem;
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

.report-box {
    margin: 0 5vh 3vh;
}
</style>
