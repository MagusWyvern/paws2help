<script setup>
import { ref, onMounted } from 'vue';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';




const firebaseApp = initializeApp({
    apiKey: "AIzaSyCxuDGiS-uw2G3Y6keIW85G8v25IeRTaBs",
    authDomain: "petscircle.firebaseapp.com",
    projectId: "petscircle",
    storageBucket: "petscircle.appspot.com",
    messagingSenderId: "195232543538",
    appId: "1:195232543538:web:f5fbb5300ffd876b325d2b",
    measurementId: "G-3PVKXCEFW3"
});



const auth = getAuth(firebaseApp);

const provider = new GoogleAuthProvider();

onMounted(() => {
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    signInBtn.onclick = () => signInWithRedirect(auth, provider);
    signOutBtn.onclick = () => auth.signOut() && location.reload();
})

/// Sign in and sign out button event handlers

getRedirectResult(auth)
    .then((result) => {
        // This gives you a Google Access Token. You can use it to access Google APIs.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;

        // The signed-in user info.
        const user = result.user;

        console.log(user.displayName)
    }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        // const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
    });

const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');
const userDetails = document.getElementById('userDetails');

auth.onAuthStateChanged(user => {
    if (user) {

        // This is what is shown to the user when it's signed in

        // whenSignedIn.style.visibility = "visible";
        // whenSignedOut.style.visibility = "hidden";
        // signInBtn.style.visibility = "hidden";

        // signOutBtn.style.display = "block";
        // whenSignedIn.style.display = "block";
        // whenSignedOut.style.display = "none";
        // signInBtn.style.display = "none";

        // Personalize userDetails section for each user

        // userDetails.innerHTML = `<img src="${user.photoURL}" style="width: 64px; height: 64px; border-radius: 50%"><br><h3>Hello ${user.displayName}! You are currently signed in</h3> <p>Your User ID is ${user.uid}</p><br><p>${user.email ? user.email : ''}</p><br><p> ${user.phoneNumber ? user.phoneNumber : ''}</p>`;

    } else {

        // This is what is shown to the user when it's not signed in

        onMounted(() => {
            // whenSignedIn.style.visibility = "hidden";
            // whenSignedOut.style.visibility = "visible";
            // userDetails.innerHTML = '';

            // signOutBtn.style.display = "none"
            // whenSignedIn.style.display = "none";
            // whenSignedOut.style.display = "block";

        })

        // Unsubscribe when the user signs out
        // personalMarkerSubscribe && publicMarkerSubscribe && unsubscribe();

    }
});
</script>

<template>

    <h3></h3>
    <button id="signInBtn" class="button">Sign In with Google</button>
    <button id="signOutBtn" class="button is-danger">Sign Out</button>


</template>