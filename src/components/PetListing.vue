<script setup>
import { setCurrentUser, getCurrentUser } from '../authenticateUser'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { auth } from '../firebase'

const isLoggedIn = ref(Boolean(getCurrentUser()))
let authUnsubscribe = null

onMounted(() => {
    authUnsubscribe = auth.onAuthStateChanged((user) => {
        setCurrentUser(user || null)
        isLoggedIn.value = Boolean(user)
    })
})

onBeforeUnmount(() => {
    if (authUnsubscribe) {
        authUnsubscribe()
    }
})

document.addEventListener('DOMContentLoaded', () => {
    // Functions to open and close a modal
    function openModal($el) {
        $el.classList.add('is-active');
    }

    function closeModal($el) {
        $el.classList.remove('is-active');
    }

    function closeAllModals() {
        (document.querySelectorAll('.modal') || []).forEach(($modal) => {
            closeModal($modal);
        });
    }

    // Add a click event on buttons to open a specific modal
    (document.querySelectorAll('#js-modal-trigger') || []).forEach(($trigger) => {
        const modal = $trigger.dataset.target;
        const $target = document.getElementById(modal);

        $trigger.addEventListener('click', () => {
            openModal($target);
        });
    });

    // Add a click event on various child elements to close the parent modal
    (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
        const $target = $close.closest('.modal');

        $close.addEventListener('click', () => {
            closeModal($target);
        });
    });

    // Add a keyboard event to close all modals
    document.addEventListener('keydown', (event) => {
        const e = event || window.event;

        if (e.keyCode === 27) { // Escape key
            closeAllModals();
        }
    });
});
</script>

<template>

    <div id="listing-form-modal" class="modal">
        <div class="modal-background"></div>

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

        <button class="modal-close is-large" aria-label="close"></button>
    </div>

    <center>
        <button v-if="isLoggedIn" class="button is-link" id="js-modal-trigger" data-target="listing-form-modal">
            Add A Listing
        </button><br><br>

    </center>
</template>

<style>

</style>
