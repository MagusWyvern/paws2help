<script setup>
import AppIcon from './icons/IconApp.vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { auth } from '../firebase'
import { setCurrentUser } from '../authenticateUser'

const currentUser = ref(null)
let authUnsubscribe = null

defineProps({
    msg: {
        type: String,
        required: true
    }
})

onMounted(() => {
    authUnsubscribe = auth.onAuthStateChanged((user) => {
        setCurrentUser(user || null)
        currentUser.value = user || null
    })

    let deferredPrompt;
    const addBtn = document.querySelector('#add-button');

    // This file handles the PWA installation

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI to notify the user they can add to home screen
        if (!addBtn) {
            return
        }

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

onBeforeUnmount(() => {
    if (authUnsubscribe) {
        authUnsubscribe()
    }
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
                            <RouterLink to="/auth" class="button is-light auth-button">
                                <img
                                    v-if="currentUser?.photoURL"
                                    :src="currentUser.photoURL"
                                    alt="User profile picture"
                                    class="user-avatar"
                                >
                                <span>{{ currentUser ? 'Account' : 'Sign In' }}</span>
                            </RouterLink>
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

.site-brand:hover,
.site-brand:focus,
.site-brand:active {
    background-color: transparent;
    color: #ffffff;
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

.navbar-item:not(.site-brand).router-link-active,
.navbar-item:not(.site-brand).router-link-exact-active {
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.15);
}

.auth-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.buttons .button:hover,
.buttons .button:focus,
.buttons .button:active {
    transform: none;
    box-shadow: none;
}

#add-button:hover,
#add-button:focus,
#add-button:active {
    background-color: #485fc7;
    border-color: transparent;
}

.auth-button:hover,
.auth-button:focus,
.auth-button:active {
    background-color: #f5f5f5;
    border-color: transparent;
}

.user-avatar {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    object-fit: cover;
}
</style>
