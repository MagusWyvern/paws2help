<script setup>
import { ref, onMounted } from 'vue';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, query, collection, onSnapshot, where } from "firebase/firestore";
import { setCurrentUser, getCurrentUser, setupHTMLHandlers } from '../authenticateUser'

const firebaseConfig = {
    apiKey: "AIzaSyCxuDGiS-uw2G3Y6keIW85G8v25IeRTaBs",
    authDomain: "petscircle.firebaseapp.com",
    projectId: "petscircle",
    storageBucket: "petscircle.appspot.com",
    messagingSenderId: "195232543538",
    appId: "1:195232543538:web:f5fbb5300ffd876b325d2b",
    measurementId: "G-3PVKXCEFW3"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();

let items

onMounted(() => {
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    const userDetails = document.getElementById('userDetails');
    const signInNowSection = document.getElementById('signInNow')
    const coordsContainer = document.getElementById('coordsContainer')

    setupHTMLHandlers()

    function deleteDocByID(button) {
        // Delete a coordinate using the id of the x icon
        id = button.getAttribute('id');

        deleteDoc(doc(db, "pet-coords", id));

    }
})

auth.onAuthStateChanged(user => {
    if (user) {
        console.info("Successfully logged in with UID: " + user.uid)

        setCurrentUser(user)

        // Hide the sign in buttion when a user is logged in
        signInButton.style.visibility = "hidden";
        signInButton.style.display = "none";
        coordsContainer.style.display = "block"

        // Personalize userDetails section for each user
        userDetails.innerHTML = `
        <img src="${user.photoURL}" style="width: 64px; height: 64px; border-radius: 50%"><br>
        <h3 class="title">Hello ${user.displayName}! </h3> 
        <p>You are currently signed in</p>
        <p class="code">${user.email ? user.email : ''}</p><br>
        `;


    } else {
        console.info("User is not currently logged in.")

        // Hide the sign out button and empty the user details section
        signOutButton.style.display = "none"
        userDetails.innerHTML = '';
        userDetails.style.display = "none"
        coordsContainer.style.display = "none"

        // Unsubscribe from Firestore queries when the user signs out
        // personalMarkerSubscribe && publicMarkerSubscribe && unsubscribe();
    }

    // Query all the markers where the current user made it
    const personalMarkersQuery = query(collection(db, "pet-coords"));


    const unsubscribe = onSnapshot(personalMarkersQuery, (querySnapshot) => {

        // Empty the list every time a new snapshot is received
        items = []

        querySnapshot.forEach((doc) => {

            // Logging: Log every fetched document from Firestore collection 'pet-coords'
            // console.log(JSON.stringify(doc.data()))

            let user = getCurrentUser()
            let listItemToPush

            if (user) {

                if (doc.data().uid == user.uid) {

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

                    // Logging: Logs the current state of the `items` array
                    // console.log("Current items array: " + items)

                } else {
                }
            }
        });

        coordsList.innerHTML = items.join('');

    })


})
</script>

<template>
    <div id="signInNow">
        <h1 class="title is-4">Ready to get started?</h1>

        <p class="subtitle is-6">Pet listing is only available for logged-in users.</p>

        <button id="signInButton" class="button is-success">Sign In with Google</button><br><br>
    </div>

    <div class="box" id="userDetails"></div><br><br>
    
    <center>

        <section id="coordsContainer">
            <h1 class="title is-4">Registered Coordinates</h1>
            <p class="subtitle is-6">This is the list of location(s) that you have registered using this account before:</p>
            <div id="coordsList">
            </div>
        </section>
    </center>

    <div>
        <button id="signOutButton" class="button is-danger">Sign Out</button>
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