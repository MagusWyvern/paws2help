<script setup>
import { ref, onMounted } from 'vue';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, query, collection, onSnapshot, where } from "firebase/firestore";
let items
var firebaseConfig = {
    apiKey: "AIzaSyCxuDGiS-uw2G3Y6keIW85G8v25IeRTaBs",
    authDomain: "petscircle.firebaseapp.com",
    projectId: "petscircle",
    storageBucket: "petscircle.appspot.com",
    messagingSenderId: "195232543538",
    appId: "1:195232543538:web:f5fbb5300ffd876b325d2b",
    measurementId: "G-3PVKXCEFW3"
};

const firebaseApp = initializeApp({
    apiKey: "AIzaSyCxuDGiS-uw2G3Y6keIW85G8v25IeRTaBs",
    authDomain: "petscircle.firebaseapp.com",
    projectId: "petscircle",
    storageBucket: "petscircle.appspot.com",
    messagingSenderId: "195232543538",
    appId: "1:195232543538:web:f5fbb5300ffd876b325d2b",
    measurementId: "G-3PVKXCEFW3"
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();

onMounted(() => {
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    const userDetails = document.getElementById('userDetails');

    signInButton.onclick = () => signInWithRedirect(auth, provider);
    signOutButton.onclick = () => auth.signOut() && location.reload()

})

getRedirectResult(auth)
    .then((result) => {

        // This gives you a Google Access Token. You can use it to access Google APIs.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;

        // The signed-in user info.
        const user = result.user;

    }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;

        // The email of the user's account used.
        // const email = error.customData.email;

        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
    });

const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');

auth.onAuthStateChanged(user => {
    if (user) {
        console.info("Logged in!")
        // This is what is shown to the user when it's signed in

        signInButton.style.visibility = "hidden";
        signInButton.style.display = "none";

        // signOutBtn.style.display = "block";
        // whenSignedIn.style.display = "block";
        // whenSignedOut.style.display = "none";

        // Personalize userDetails section for each user
        userDetails.innerHTML = `
        <img src="${user.photoURL}" style="width: 64px; height: 64px; border-radius: 50%"><br>
        <h3>Hello ${user.displayName}! You are currently signed in.</h3> 
        <p>Your User ID is ${user.uid}</p><br><p>${user.email ? user.email : ''}</p><br>
        <p> ${user.phoneNumber ? user.phoneNumber : ''}</p>
        `;


    } else {
        console.info("Logged out!")

        signOutButton.style.display = "none"
        userDetails.innerHTML = '';

        // Unsubscribe when the user signs out
        // personalMarkerSubscribe && publicMarkerSubscribe && unsubscribe();

    }

    // Query all the markers where the current user made it
    const personalMarkersQuery = query(collection(db, "pet-coords"));

    items = []

    const unsubscribe = onSnapshot(personalMarkersQuery, (querySnapshot) => {
        const cities = [];

        querySnapshot.forEach((doc) => {

            console.log(JSON.stringify(doc.data()))



            let listItemToPush

            if (doc.data().uid == user.uid) {

                listItemToPush = `
                    <div class="box" style="width: 75%">

                                <li style="list-style: none;" id="${doc.id}">Latitude: ${doc.data().coords[0]}, Longitude: ${doc.data().coords[1]}</li>
                                <strong>${doc.data().addressName.toLocaleString()}</strong> <br>
                                <small>${doc.data().createdAt.toDate().toDateString()}</small> <br>


                                <button data-docid="${doc.id}" id="deleteBtn" class="button" onclick="deleteDocbyID(this)">Delete</button>
                    </div>
                    `
                
                items.push(listItemToPush)
                
                console.log("Current items array: " + items)

                } else {
            }
        });

        coordsList.innerHTML = items.join('');

    })
})
</script>

<template>



    <div>
        <button id="signInButton" class="button">Sign In with Google</button><br><br>
    </div>

    <div class="box" id="userDetails"></div>



    <div id="coordsList"></div>

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
</style>