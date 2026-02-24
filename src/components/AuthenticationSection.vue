<script setup>
import { onBeforeUnmount, onMounted } from 'vue';
import { query, collection, onSnapshot } from "firebase/firestore";
import { auth, db } from '../firebase';
import { setCurrentUser, getCurrentUser, setupHTMLHandlers } from '../authenticateUser'

let items
let authUnsubscribe = null
let markersUnsubscribe = null

onMounted(() => {
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    const userDetails = document.getElementById('userDetails');
    const coordsContainer = document.getElementById('coordsContainer')
    const coordsList = document.getElementById('coordsList')

    setupHTMLHandlers({ signInButton, signOutButton })

    signOutButton.style.display = "none"
    userDetails.innerHTML = ''
    userDetails.style.display = "none"
    coordsContainer.style.display = "none"
    coordsList.innerHTML = ''

    authUnsubscribe = auth.onAuthStateChanged((user) => {
        if (markersUnsubscribe) {
            markersUnsubscribe()
            markersUnsubscribe = null
        }

        if (user) {
            console.info("Successfully logged in with UID: " + user.uid)

            setCurrentUser(user)

            // Hide the sign in button when a user is logged in
            signInButton.style.visibility = "hidden";
            signInButton.style.display = "none";
            signOutButton.style.display = "inline-flex"
            userDetails.style.display = "flex"
            coordsContainer.style.display = "block"

            // Personalize userDetails section for each user
            userDetails.innerHTML = `
            <img src="${user.photoURL}" style="width: 64px; height: 64px; border-radius: 50%"><br>
            <h3 class="title">Hello ${user.displayName}! </h3> 
            <p>You are currently signed in</p>
            <p class="code">${user.email ? user.email : ''}</p><br>
            `;

            // Query all the markers where the current user made it
            const personalMarkersQuery = query(collection(db, "pet-coords"));

            markersUnsubscribe = onSnapshot(personalMarkersQuery, (querySnapshot) => {
                // Empty the list every time a new snapshot is received
                items = []

                querySnapshot.forEach((doc) => {
                    let currentUser = getCurrentUser()
                    let listItemToPush

                    if (currentUser && doc.data().uid == currentUser.uid) {
                        listItemToPush = `
                        <div class="card" style="width: 75%; border-radius: 10px">
                            <header class="card-header">
                                <p class="card-header-title">
                                    ${doc.data().addressName.toLocaleString()}
                                </p>
                                <button class="card-header-icon" aria-label="more options">
                                    <span class="icon">
                                        <i class="fas fa-angle-down" aria-hidden="true"></i>
                                    </span>
                                </button>
                            </header>
                            <div class="card-content">
                                <div class="content">
                                    <li style="list-style: none;" id="${doc.id}"><b>Latitude: </b>${doc.data().coords[0]}, <b>Longitude: </b>${doc.data().coords[1]}</li>
                                </div>
                            </div>
                            <footer class="card-footer">
                                <a href="#" class="card-footer-item">Share</a>
                                <a href="#" class="card-footer-item">Edit</a>
                                <a href="#" class="card-footer-item has-background-danger has-text-primary-light" id="${doc.id}" onClick="">Delete</a>
                            </footer>
                        </div><br><br>
                            `

                        items.push(listItemToPush)
                    }
                });

                coordsList.innerHTML = items.join('');
            })
        } else {
            console.info("User is not currently logged in.")

            setCurrentUser(null)

            signInButton.style.visibility = "visible"
            signInButton.style.display = "inline-flex"
            signOutButton.style.display = "none"
            userDetails.innerHTML = '';
            userDetails.style.display = "none"
            coordsContainer.style.display = "none"
            coordsList.innerHTML = ''
        }
    })
})

onBeforeUnmount(() => {
    if (authUnsubscribe) {
        authUnsubscribe()
    }

    if (markersUnsubscribe) {
        markersUnsubscribe()
    }
})
</script>

<template>
    <div id="signInNow">
        <h1 class="title is-4">Ready to get started?</h1>

        <p class="subtitle is-6">Pet listing is only available for logged-in users.</p>

        <button id="signInButton" class="button is-success">Sign In with Google</button><br><br>
    </div>

    <div class="box" id="userDetails" style="display: none;"></div><br><br>
    
    <center>

        <section id="coordsContainer" style="display: none;">
            <h1 class="title is-4">Registered Coordinates</h1>
            <p class="subtitle is-6">This is the list of location(s) that you have registered using this account before:</p>
            <div id="coordsList">
            </div>
        </section>
    </center>

    <div>
        <button id="signOutButton" class="button is-danger" style="display: none;">Sign Out</button>
    </div>

</template>

<style scoped>
div {
    padding-top: 2em;
    display: flex;
    align-items: center;
    align-content: center;
    flex-wrap: wrap;
    flex-direction: column;
}

#coordsContainer {
    padding-left: 2em;
}

.subtitle {
    padding: 2em;
}

#userDetails {
    background-color: #85CEFF;
}

#coordsList {
    padding: 2em
}


</style>
