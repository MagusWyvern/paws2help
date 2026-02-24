<script setup>
import AppIcon from './icons/IconApp.vue'
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

defineProps({
    msg: {
        type: String,
        required: true
    }
})

onMounted(() => {

    let deferredPrompt;
    const addBtn = document.querySelector('#add-button');

    // This file handles the PWA installation

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI to notify the user they can add to home screen
        addBtn.style.display = 'block';

        addBtn.addEventListener('click', (e) => {
            // hide our user interface that shows our A2HS button
            // Show the prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                } else {
                    console.log('User dismissed the A2HS prompt');
                }
                deferredPrompt = null;
            });
        });
    });

})

</script>

<template>

    <nav class="navbar is-mobile">
        <div class="container">
            <div id="navMenu" class="navbar-menu">
                <div class="navbar-start">
                    <RouterLink to="/" class="navbar-item">Home</RouterLink>
                    <RouterLink to="/auth" class="navbar-item">Account</RouterLink>
                    <RouterLink to="/map" class="navbar-item">Map</RouterLink>
                </div>

                <div class="navbar-end">
                    <div class="navbar-item">
                        <div class="buttons">
                            <a id="add-button" class="button is-link">Download App</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <section class="hero is-primary">
        <div class="hero-body">
            <div class="wrapper">
                <AppIcon />
                <p class="title">
                    {{ msg }}
                </p>
            </div>
            <p class="subtitle">Helping the community to care for cats around the country &#60;3 </p>
        </div>
    </section>


</template>

<style scoped>
.wrapper {
    display: flex;
    align-items: center;
}

.hero {
    background-color: #3D3B8E;
    border-radius: 10px;
    width: 100%;
}
</style>
