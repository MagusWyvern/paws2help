<script setup>
import { setCurrentUser, getCurrentUser } from '../authenticateUser'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { auth } from '../firebase'

const isLoggedIn = ref(Boolean(getCurrentUser()))
const isModalActive = ref(false)
let authUnsubscribe = null

function openModal() {
    isModalActive.value = true
}

function closeModal() {
    isModalActive.value = false
}

function closeOnEscape(event) {
    if (event.key === 'Escape') {
        closeModal()
    }
}

onMounted(() => {
    authUnsubscribe = auth.onAuthStateChanged((user) => {
        setCurrentUser(user || null)
        isLoggedIn.value = Boolean(user)
    })
    document.addEventListener('keydown', closeOnEscape)
})

onBeforeUnmount(() => {
    if (authUnsubscribe) {
        authUnsubscribe()
    }

    document.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
    <div id="listing-form-modal" class="modal" :class="{ 'is-active': isModalActive }">
        <div class="modal-background" @click="closeModal"></div>

        <div class="modal-content">
            <div class="box">
                <h3 class="title">Listing Form</h3>

                <p>Full Name</p>
                <input class="input" type="text" placeholder="Your name" id="creatorName"><br><br>

                <p>Phone Number</p>
                <input id="creatorPhone" class="input" type="text" placeholder="Your number"><br><br>

                <p>Pet Image</p>
                <sub>You can upload the image to <a href="https://imgur.com/">imgur</a> or <a
                        href="https://imgbb.com/">imgBB</a> and share the link here!</sub>
                <input id="petImage" class="input" type="text" placeholder="Your image url"><br><br>

                <p>I am donating pets 📤 <input type="checkbox" id="donate" name="donate" value="true"></p><br>
                <p class="description">I want to adopt pets 📥 <input type="checkbox" id="adopt" name="adopt"
                        value="true">
                </p>
                <br>

                <p class="description">When you're ready, tap the button to list your current location on the map!</p>
                <sub>Make sure your address is at the center of the map view!</sub><br>
                <button id="createThing" class="button is-primary">Mark my location on the map</button>
            </div>
        </div>

        <button class="modal-close is-large" aria-label="close" @click="closeModal"></button>
    </div>

    <center>
        <button v-if="isLoggedIn" class="button is-link" @click="openModal">
            Add A Listing
        </button><br><br>

    </center>
</template>

<style>

</style>
