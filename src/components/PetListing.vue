<script setup>
import { setCurrentUser, getCurrentUser } from '../authenticateUser'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { auth } from '../firebase'
import { addPetCoords } from '../addPetCoords'

const DEFAULT_PICKER_CENTER = [4.225128, 102.249195]

const isLoggedIn = ref(Boolean(getCurrentUser()))
const isFormVisible = ref(false)
const selectedIntent = ref('')
const selectedLatitude = ref(null)
const selectedLongitude = ref(null)
const selectedAddressPreview = ref('Move the map or use current location to preview an address.')
const isLocationBusy = ref(false)
let authUnsubscribe = null
let locationPickerMap = null
let locationPickerMarker = null
let reverseGeocodeTimer = null

const isGivingAway = computed(() => selectedIntent.value === 'give')
const listingTitle = computed(() => (isGivingAway.value ? 'Give Away a Pet Listing' : 'Looking to Adopt a Pet Listing'))
const nameLabel = computed(() => 'Name/Nickname')
const phoneLabel = computed(() =>
    isGivingAway.value ? 'Phone Number for Interested Adopters' : 'Phone Number for Pet Owners to Contact'
)
const imageLabel = computed(() => (isGivingAway.value ? 'Pet Image' : 'Profile Image (Optional)'))
const imageHelpText = computed(() =>
    isGivingAway.value
        ? 'Share a clear image of the pet so adopters can recognize them.'
        : 'Optional: share a profile image so pet owners can identify who they are contacting.'
)
const mapActionText = computed(() =>
    isGivingAway.value
        ? "When you're ready, list your location so adopters can find your listing."
        : "When you're ready, list your location so pet owners can find your adoption request."
)
const canSubmitListing = computed(() =>
    Boolean(selectedIntent.value) &&
    selectedLatitude.value !== null &&
    selectedLongitude.value !== null &&
    !isLocationBusy.value
)

function initializeLocationPickerMap() {
    if (locationPickerMap) {
        return
    }

    locationPickerMap = L.map('listing_location_map', {
        zoomControl: true,
    }).setView(DEFAULT_PICKER_CENTER, 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(locationPickerMap)

    locationPickerMarker = L.marker(DEFAULT_PICKER_CENTER, {
        alt: '',
        keyboard: false,
        title: '',
    }).addTo(locationPickerMap)

    setSelectedLocation(DEFAULT_PICKER_CENTER[0], DEFAULT_PICKER_CENTER[1], { recenterMap: false })

    locationPickerMap.on('moveend', () => {
        const currentCenter = locationPickerMap.getCenter()
        setSelectedLocation(currentCenter.lat, currentCenter.lng, { recenterMap: false })
    })
}

function refreshLocationPickerMap() {
    nextTick(() => {
        initializeLocationPickerMap()
        setTimeout(() => {
            locationPickerMap?.invalidateSize()
        }, 0)
    })
}

function setSelectedLocation(latitude, longitude, { recenterMap = true } = {}) {
    selectedLatitude.value = Number(latitude)
    selectedLongitude.value = Number(longitude)

    if (locationPickerMarker) {
        locationPickerMarker.setLatLng([selectedLatitude.value, selectedLongitude.value])
    }

    if (recenterMap && locationPickerMap) {
        locationPickerMap.setView([selectedLatitude.value, selectedLongitude.value], locationPickerMap.getZoom())
    }

    scheduleAddressPreviewUpdate(selectedLatitude.value, selectedLongitude.value)
}

function scheduleAddressPreviewUpdate(latitude, longitude) {
    if (reverseGeocodeTimer) {
        window.clearTimeout(reverseGeocodeTimer)
    }

    reverseGeocodeTimer = window.setTimeout(() => {
        updateAddressPreview(latitude, longitude)
    }, 350)
}

async function updateAddressPreview(latitude, longitude) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        selectedAddressPreview.value = 'Address preview unavailable.'
        return
    }

    isLocationBusy.value = true
    selectedAddressPreview.value = 'Resolving address preview...'

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
        const data = await response.json()
        selectedAddressPreview.value = data?.display_name || 'Address preview unavailable for this location.'
    } catch (error) {
        console.error('Failed to fetch address preview:', error)
        selectedAddressPreview.value = 'Failed to load address preview. You can still submit with coordinates.'
    } finally {
        isLocationBusy.value = false
    }
}

function centerPickerOnCurrentLocation() {
    if (!navigator.geolocation) {
        window.alert('Geolocation is not supported in this browser.')
        return
    }

    isLocationBusy.value = true

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const latitude = position.coords.latitude
            const longitude = position.coords.longitude
            setSelectedLocation(latitude, longitude)
            if (locationPickerMap) {
                locationPickerMap.setView([latitude, longitude], 15)
            }
            isLocationBusy.value = false
        },
        () => {
            isLocationBusy.value = false
            window.alert('Unable to read your current location. Please move the map manually.')
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        }
    )
}

function toggleForm() {
    if (isFormVisible.value) {
        closeForm()
        return
    }
    isFormVisible.value = true
    refreshLocationPickerMap()
}

function closeForm() {
    isFormVisible.value = false
    selectedIntent.value = ''
}

function selectIntent(intent) {
    selectedIntent.value = intent
    nextTick(() => {
        prefillNameFromAccount()
        refreshLocationPickerMap()
    })
}

function prefillNameFromAccount() {
    const currentUser = getCurrentUser()
    const displayName = typeof currentUser?.displayName === 'string' ? currentUser.displayName.trim() : ''
    if (!displayName) {
        return
    }

    const creatorNameInput = document.getElementById('creatorName')
    if (!creatorNameInput) {
        return
    }

    if (!creatorNameInput.value.trim()) {
        creatorNameInput.value = displayName
    }
}

function closeOnEscape(event) {
    if (event.key === 'Escape' && isFormVisible.value) {
        closeForm()
    }
}

async function submitListing() {
    const currentUser = getCurrentUser()
    if (!currentUser) {
        window.alert('Sign in to create a listing.')
        return
    }

    if (selectedLatitude.value === null || selectedLongitude.value === null) {
        window.alert('Please pick a location on the map first.')
        return
    }

    try {
        await addPetCoords(selectedLatitude.value, selectedLongitude.value, currentUser.uid)
        closeForm()
    } catch (error) {
        console.error('Failed to create listing:', error)
        window.alert('Failed to create listing. Please try again.')
    }
}

onMounted(() => {
    authUnsubscribe = auth.onAuthStateChanged((user) => {
        setCurrentUser(user || null)
        isLoggedIn.value = Boolean(user)
        if (!user) {
            closeForm()
            return
        }
        if (isFormVisible.value && selectedIntent.value) {
            nextTick(() => {
                prefillNameFromAccount()
                refreshLocationPickerMap()
            })
        }
    })
    document.addEventListener('keydown', closeOnEscape)
})

onBeforeUnmount(() => {
    if (authUnsubscribe) {
        authUnsubscribe()
    }

    if (reverseGeocodeTimer) {
        window.clearTimeout(reverseGeocodeTimer)
    }

    if (locationPickerMap) {
        locationPickerMap.remove()
        locationPickerMap = null
        locationPickerMarker = null
    }

    document.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
    <section class="listing-form-shell">
        <button v-if="isLoggedIn" class="button is-link" @click="toggleForm">
            {{ isFormVisible ? 'Hide Listing Form' : 'Add A Listing' }}
        </button>

        <div v-if="!isLoggedIn" class="is-size-7 mt-2">Sign in to add a listing.</div>

        <div v-show="isFormVisible && isLoggedIn" class="box listing-inline-form">
            <h3 class="title is-5">What kind of listing do you want to create?</h3>
            <p class="description">Choose one option first.</p>

            <div class="intent-selector">
                <button
                    type="button"
                    class="button"
                    :class="isGivingAway ? 'is-link' : 'is-light'"
                    @click="selectIntent('give')"
                >
                    Give away a pet
                </button>
                <button
                    type="button"
                    class="button"
                    :class="!isGivingAway && selectedIntent ? 'is-link' : 'is-light'"
                    @click="selectIntent('adopt')"
                >
                    Get a pet
                </button>
            </div>

            <div v-if="selectedIntent" class="intent-form-body">
                <h4 class="title is-6">{{ listingTitle }}</h4>

                <p>{{ nameLabel }}</p>
                <input class="input" type="text" placeholder="Your name or nickname" id="creatorName"><br><br>

                <p>{{ phoneLabel }}</p>
                <input id="creatorPhone" class="input" type="text" placeholder="Your number"><br><br>

                <p>{{ imageLabel }}</p>
                <sub>{{ imageHelpText }} You can upload to <a href="https://imgur.com/">imgur</a> or <a href="https://imgbb.com/">imgBB</a>.</sub>
                <input id="petImage" class="input" type="text" placeholder="Image URL"><br><br>

                <p>Pet species/type</p>
                <sub>Choose a common household pet that is legal to own in your area.</sub>
                <div class="select is-fullwidth">
                    <select id="petSpecies">
                        <option value="">Select species/type</option>
                        <option value="Cat">Cat</option>
                        <option value="Dog">Dog</option>
                        <option value="Rabbit">Rabbit</option>
                        <option value="Hamster">Hamster</option>
                        <option value="Guinea Pig">Guinea Pig</option>
                        <option value="Bird">Bird</option>
                        <option value="Fish">Fish</option>
                        <option value="Turtle">Turtle</option>
                        <option value="Ferret">Ferret</option>
                        <option value="Other (legal pet)">Other (legal pet)</option>
                    </select>
                </div>
                <br>

                <p>Preferred contact method</p>
                <div class="select is-fullwidth">
                    <select id="contactMethod">
                        <option value="">Select a contact method</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Call">Call</option>
                        <option value="SMS">SMS</option>
                    </select>
                </div>
                <br>

                <p>Best time to contact</p>
                <input id="contactTime" class="input" type="text" placeholder="e.g. Weekdays after 6 PM"><br><br>

                <p>Additional notes</p>
                <textarea id="listingNotes" class="textarea" placeholder="Any extra context for people viewing your listing"></textarea><br>

                <div v-if="isGivingAway">
                    <p>Pet age</p>
                    <input id="petAge" class="input" type="text" placeholder="e.g. 2 years old"><br><br>

                    <p>Vaccination / neutered status</p>
                    <div class="select is-fullwidth">
                        <select id="vaccinationStatus">
                            <option value="">Select status</option>
                            <option value="Vaccinated and neutered">Vaccinated and neutered</option>
                            <option value="Vaccinated only">Vaccinated only</option>
                            <option value="Not vaccinated">Not vaccinated</option>
                            <option value="Unknown">Unknown</option>
                        </select>
                    </div>
                    <br>

                    <p>Pet temperament</p>
                    <input id="petTemperament" class="input" type="text" placeholder="e.g. Friendly, playful, shy"><br><br>

                    <p>Reason for rehoming</p>
                    <textarea id="rehomingReason" class="textarea" placeholder="Explain why you are giving away this pet"></textarea><br>

                    <p>Adoption requirements</p>
                    <textarea id="adoptionRequirements" class="textarea" placeholder="e.g. Indoor-only home, no aggressive pets"></textarea><br>
                </div>

                <div v-else>
                    <p>Home type</p>
                    <div class="select is-fullwidth">
                        <select id="homeType">
                            <option value="">Select home type</option>
                            <option value="Apartment">Apartment</option>
                            <option value="House">House</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <br>

                    <p>Existing pets at home</p>
                    <input id="existingPets" class="input" type="text" placeholder="e.g. 1 cat, 1 dog, none"><br><br>

                    <p>Preferred pet age</p>
                    <input id="preferredPetAge" class="input" type="text" placeholder="e.g. Kitten or adult"><br><br>

                    <p>Can you handle medical costs / special needs?</p>
                    <div class="select is-fullwidth">
                        <select id="canHandleMedical">
                            <option value="">Select an option</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="Depends">Depends</option>
                        </select>
                    </div>
                    <br>
                </div>

                <input id="listingIntent" type="hidden" :value="selectedIntent">

                <p class="description">{{ mapActionText }}</p>
                <sub>Select a close region from the map below. The center marker is your selected spot.</sub>
                <div class="location-picker-actions">
                    <button type="button" class="button is-small is-info is-light" @click="centerPickerOnCurrentLocation" :disabled="isLocationBusy">
                        Center on my current location
                    </button>
                    <button type="button" class="button is-small is-light" @click="refreshLocationPickerMap">
                        Refresh map view
                    </button>
                </div>
                <div id="listing_location_map" class="listing-location-map"></div>
                <p class="is-size-7 mt-2">
                    Selected coordinates:
                    <strong>
                        {{ selectedLatitude !== null ? selectedLatitude.toFixed(6) : 'N/A' }},
                        {{ selectedLongitude !== null ? selectedLongitude.toFixed(6) : 'N/A' }}
                    </strong>
                </p>
                <p class="is-size-7">
                    Address preview:
                    <strong>{{ selectedAddressPreview }}</strong>
                </p>
            </div>

            <div class="listing-form-actions">
                <button id="createThing" type="button" class="button is-primary" :disabled="!canSubmitListing" @click="submitListing">
                    Mark selected location on the map
                </button>
                <button type="button" class="button is-light" @click="closeForm">Cancel</button>
            </div>
        </div>
    </section>
</template>

<style scoped>
.listing-form-shell {
    margin: 0 5vh 3vh;
}

.listing-inline-form {
    margin-top: 0.75rem;
}

.listing-form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.6rem;
}

.intent-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin: 0.8rem 0 1rem;
}

.intent-form-body {
    margin-top: 0.35rem;
}

.location-picker-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.7rem;
}

.listing-location-map {
    margin-top: 0.6rem;
    height: 260px;
    border: 1px solid #dbdbdb;
    border-radius: 8px;
    overflow: hidden;
}
</style>
