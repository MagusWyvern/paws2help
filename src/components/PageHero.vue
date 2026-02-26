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

    <nav class="navbar is-mobile site-navbar">
        <div class="navbar-shell">
            <div id="navMenu" class="navbar-menu is-active">
                <div class="navbar-start">
                    <RouterLink to="/" class="navbar-item site-brand">
                        <AppIcon class="brand-icon" />
                        <span class="brand-name">{{ msg }}</span>
                    </RouterLink>
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
</template>

<style scoped>
.site-navbar {
    background-color: #3D3B8E;
    border-radius: 10px;
}

.navbar-shell {
    width: 100%;
    padding: 0 0.5rem;
}

.navbar-menu.is-active {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.navbar-start {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-right: auto;
}

.navbar-end {
    display: flex;
    align-items: center;
    margin-left: auto;
}

.site-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
}

.brand-icon {
    width: 2rem;
}

.brand-name {
    color: #ffffff;
}

.navbar-item {
    color: #ffffff;
}

.navbar-item:hover {
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.15);
}
</style>
