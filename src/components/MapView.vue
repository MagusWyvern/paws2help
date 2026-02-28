<script setup>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { query, collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../firebase';
import { getCurrentUser } from '../authenticateUser';
import { donatingCatIcon, receivingCatIcon } from './icons/LeafletIcon'
import { useRoute, useRouter } from 'vue-router';

let mymap
let markers = []
const markerByListingId = new Map()
const listingById = new Map()

var popup = L.popup();
const mapInteractionEnabled = ref(false);
let markersUnsubscribe = null;
let authUnsubscribe = null;
const interactionKeyLabel = ref('Ctrl');
const isLoggedIn = ref(Boolean(getCurrentUser()));
const selectedListing = ref(null)
const route = useRoute()
const router = useRouter()

const selectedListingRows = computed(() => {
    if (!selectedListing.value) {
        return []
    }

    const listing = selectedListing.value
    const rows = [
        { label: 'Listing Type', value: listing.donate ? 'Giving away a pet' : 'Looking for a pet' },
        { label: 'Pet species/type', value: listing.petSpecies },
        { label: 'Name/Nickname', value: listing.creatorName },
        { label: 'Phone Number', value: listing.creatorPhone },
        { label: 'Address', value: listing.addressName },
        { label: 'Preferred contact method', value: listing.contactMethod },
        { label: 'Best time to contact', value: listing.contactTime },
        { label: 'Additional notes', value: listing.listingNotes },
        { label: 'Coordinates', value: `${listing.coords[0].toFixed(6)}, ${listing.coords[1].toFixed(6)}` },
    ]

    if (listing.donate) {
        rows.push(
            { label: 'Pet age', value: listing.petAge },
            { label: 'Vaccination / neutered status', value: listing.vaccinationStatus },
            { label: 'Pet temperament', value: listing.petTemperament },
            { label: 'Reason for rehoming', value: listing.rehomingReason },
            { label: 'Adoption requirements', value: listing.adoptionRequirements },
        )
    } else {
        rows.push(
            { label: 'Home type', value: listing.homeType },
            { label: 'Existing pets at home', value: listing.existingPets },
            { label: 'Preferred pet age', value: listing.preferredPetAge },
            { label: 'Can handle medical costs / special needs', value: listing.canHandleMedical },
        )
    }

    return rows.filter((row) => typeof row.value === 'string' ? row.value.trim().length > 0 : Boolean(row.value))
})

const canMessageSelectedOwner = computed(() => {
    const currentUser = getCurrentUser()
    if (!currentUser || !selectedListing.value?.ownerUid) {
        return false
    }
    return currentUser.uid !== selectedListing.value.ownerUid
})

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

function escapeHTML(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
}

function buildListingPayload(listingDoc, listing) {
    const coords = Array.isArray(listing.coords) ? listing.coords : null
    if (!coords || coords.length < 2) {
        return null
    }

    return {
        id: listingDoc.id,
        coords: [Number(coords[0]), Number(coords[1])],
        donate: Boolean(listing.donate),
        petImage: listing.petImage || "../assets/logo.svg",
        creatorName: listing.creatorName || "Anonymous",
        creatorPhone: listing.creatorPhone || "No phone number provided",
        ownerUid: listing.uid || '',
        addressName: listing.addressName || 'Unknown address',
        petSpecies: listing.petSpecies || '',
        contactMethod: listing.contactMethod || '',
        contactTime: listing.contactTime || '',
        listingNotes: listing.listingNotes || '',
        petAge: listing.petAge || '',
        vaccinationStatus: listing.vaccinationStatus || '',
        petTemperament: listing.petTemperament || '',
        rehomingReason: listing.rehomingReason || '',
        adoptionRequirements: listing.adoptionRequirements || '',
        homeType: listing.homeType || '',
        existingPets: listing.existingPets || '',
        preferredPetAge: listing.preferredPetAge || '',
        canHandleMedical: listing.canHandleMedical || '',
    }
}

function syncSelectedListingFromRoute() {
    if (route.path !== '/map') {
        return
    }

    const listingId = typeof route.query.listing === 'string' ? route.query.listing : ''
    if (!listingId) {
        selectedListing.value = null
        return
    }

    const listingToSelect = listingById.get(listingId)
    if (!listingToSelect) {
        return
    }

    selectedListing.value = listingToSelect
    const marker = markerByListingId.get(listingId)
    if (marker) {
        marker.openPopup()
    }
}

function onListingMarkerClick(listingPayload) {
    if (route.path !== '/map') {
        router.push({
            path: '/map',
            query: { listing: listingPayload.id },
        })
        return
    }

    selectedListing.value = listingPayload
    if (route.query.listing !== listingPayload.id) {
        router.replace({
            path: '/map',
            query: { ...route.query, listing: listingPayload.id },
        })
    }
}

function startChatForSelectedListing() {
    if (!selectedListing.value) {
        return
    }

    const currentUser = getCurrentUser()
    if (!currentUser) {
        window.alert('Sign in to start a chat.')
        return
    }

    if (!selectedListing.value.ownerUid || selectedListing.value.ownerUid === currentUser.uid) {
        return
    }

    window.dispatchEvent(new CustomEvent('p2h:start-chat', {
        detail: {
            listingId: selectedListing.value.id,
            listingAddress: selectedListing.value.addressName,
            listingOwnerUid: selectedListing.value.ownerUid,
            listingOwnerName: selectedListing.value.creatorName || 'Pet owner',
        },
    }))
}

function buildListingShareUrl(listingId) {
    return `${window.location.origin}/map?listing=${encodeURIComponent(listingId)}`
}

async function shareSelectedListing() {
    if (!selectedListing.value?.id) {
        return
    }

    const shareUrl = buildListingShareUrl(selectedListing.value.id)
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareUrl)
            window.alert('Listing link copied to clipboard.')
            return
        }
    } catch (error) {
        console.error('Clipboard copy failed:', error)
    }

    const fallbackInput = document.createElement('input')
    fallbackInput.value = shareUrl
    document.body.appendChild(fallbackInput)
    fallbackInput.select()
    document.execCommand('copy')
    document.body.removeChild(fallbackInput)
    window.alert('Listing link copied to clipboard.')
}

function onPopupOpen(event) {
    const popupElement = event.popup?.getElement()
    if (!popupElement) {
        return
    }

    const startChatButton = popupElement.querySelector('.start-chat-button')
    if (!startChatButton) {
        return
    }

    startChatButton.addEventListener('click', () => {
        const currentUser = getCurrentUser()
        if (!currentUser) {
            window.alert('Sign in to start a chat.')
            return
        }

        const ownerUid = startChatButton.dataset.ownerUid
        if (!ownerUid || ownerUid === currentUser.uid) {
            return
        }

        window.dispatchEvent(new CustomEvent('p2h:start-chat', {
            detail: {
                listingId: startChatButton.dataset.listingId || '',
                listingAddress: startChatButton.dataset.listingAddress || '',
                listingOwnerUid: ownerUid,
                listingOwnerName: startChatButton.dataset.listingOwnerName || 'Pet owner',
            },
        }))
        mymap.closePopup()
    }, { once: true })
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
    mymap.on('popupopen', onPopupOpen)

    // Query the data from Firestore, then plot it on the map with Leaflet icons
    const markersQuery = query(collection(db, "pet-coords"));

    markersUnsubscribe = onSnapshot(markersQuery, (querySnapshot) => {
        markers.forEach((marker) => {
            mymap.removeLayer(marker)
        })
        markers = []
        markerByListingId.clear()
        listingById.clear()

        querySnapshot.forEach((listingDoc) => {
            const listing = listingDoc.data()
            const listingPayload = buildListingPayload(listingDoc, listing)
            if (!listingPayload) {
                return
            }
            const { id, coords, petImage, creatorName, creatorPhone, ownerUid, addressName } = listingPayload
            listingById.set(id, listingPayload)
            const currentUser = getCurrentUser()
            const canStartChat = Boolean(
                currentUser &&
                ownerUid &&
                currentUser.uid !== ownerUid
            )

            const chosenIcon = listingPayload.donate ? donatingCatIcon : receivingCatIcon

            const chatButtonMarkup = canStartChat
                ? `
                <button
                    class="button is-small is-link mt-2 start-chat-button"
                    data-listing-id="${escapeHTML(id)}"
                    data-owner-uid="${escapeHTML(ownerUid)}"
                    data-listing-owner-name="${escapeHTML(creatorName)}"
                    data-listing-address="${escapeHTML(addressName)}"
                >
                    Message Owner
                </button>
                `
                : ''

            const marker = new L.marker([coords[0], coords[1]], { icon: chosenIcon }).bindPopup(`
                <div>
                    <p>${listingPayload.donate ? 'I am giving away a pet' : 'I am looking for a pet'}.</p>
                    <p><b>Address:</b> ${escapeHTML(addressName)}</p>
                    <p><b>Name:</b> ${escapeHTML(creatorName)}</p>
                    <p><b>Phone Number:</b> ${escapeHTML(creatorPhone)}</p>
                    <img src="${escapeHTML(petImage)}" alt="Pet image" style="width: 84px; height: 84px; border-radius: 50%">
                    ${chatButtonMarkup}
                </div>
            `)
            marker.on('click', () => onListingMarkerClick(listingPayload))

            markers.push(marker)
            markerByListingId.set(id, marker)
            mymap.addLayer(marker)
        })

        const selectedId = selectedListing.value?.id
        if (selectedId && listingById.has(selectedId)) {
            selectedListing.value = listingById.get(selectedId)
        } else if (selectedId) {
            selectedListing.value = null
        }

        syncSelectedListingFromRoute()
    });

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

watch(() => route.query.listing, () => {
    syncSelectedListingFromRoute()
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', updateInteractionModifierState);
    window.removeEventListener('keyup', updateInteractionModifierState);
    window.removeEventListener('blur', resetInteractionModifierState);
    if (mymap) {
        mymap.off('popupopen', onPopupOpen)
    }

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
            <h3 class="title is-5">Selected Listing Details</h3>
            <p v-if="!selectedListing" class="is-size-7">
                Click a listing marker to open its full details here.
            </p>

            <div v-else>
                <div class="selected-listing-header">
                    <img
                        :src="selectedListing.petImage"
                        alt="Selected listing pet image"
                        class="selected-listing-image"
                    >
                    <div>
                        <p class="is-size-6 has-text-weight-semibold">{{ selectedListing.creatorName }}</p>
                        <p class="is-size-7">{{ selectedListing.addressName }}</p>
                    </div>
                </div>

                <div class="selected-listing-grid">
                    <div v-for="row in selectedListingRows" :key="row.label" class="selected-listing-row">
                        <p class="selected-listing-label">{{ row.label }}</p>
                        <p class="selected-listing-value">{{ row.value }}</p>
                    </div>
                </div>

                <button
                    v-if="canMessageSelectedOwner"
                    class="button is-link is-small mt-2"
                    @click="startChatForSelectedListing"
                >
                    Message Owner
                </button>
                <button
                    class="button is-small is-light mt-2 ml-2"
                    @click="shareSelectedListing"
                >
                    Share Listing
                </button>
            </div>
        </section>

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

.selected-listing-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.selected-listing-image {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
}

.selected-listing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.75rem;
}

.selected-listing-row {
    padding: 0.65rem;
    border: 1px solid #ececec;
    border-radius: 8px;
    background: #fafafa;
}

.selected-listing-label {
    margin: 0;
    font-size: 0.78rem;
    color: #666;
}

.selected-listing-value {
    margin: 0.2rem 0 0;
    font-size: 0.93rem;
    color: #1f1f1f;
    word-break: break-word;
}
</style>
