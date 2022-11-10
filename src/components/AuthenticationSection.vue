<script setup>
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, getRedirectResult } from 'firebase/auth';

const firebaseApp = initializeApp({
    apiKey: "AIzaSyCxuDGiS-uw2G3Y6keIW85G8v25IeRTaBs",
    authDomain: "petscircle.firebaseapp.com",
    projectId: "petscircle",
    storageBucket: "petscircle.appspot.com",
    messagingSenderId: "195232543538",
    appId: "1:195232543538:web:f5fbb5300ffd876b325d2b",
    measurementId: "G-3PVKXCEFW3"
});

const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const facebookSignInBtn = document.getElementById('facebookSignInBtn');

const auth2 = getAuth(firebaseApp);
console.log("info:" + auth2)

// const provider = new firebase.auth.GoogleAuthProvider();
// const facebookProvider = new firebase.auth.FacebookAuthProvider();

// /// Sign in and sign out button event handlers

// signInBtn.onclick = () => auth.signInWithPopup(provider);

// signOutBtn.onclick = () => auth.signOut() && location.reload();

// const whenSignedIn = document.getElementById('whenSignedIn');
// const whenSignedOut = document.getElementById('whenSignedOut');
// const userDetails = document.getElementById('userDetails');

// auth.onAuthStateChanged(user => {
//     if (user) {

//         // This is what is shown to the user when it's signed in

//         whenSignedIn.style.visibility = "visible";
//         whenSignedOut.style.visibility = "hidden";
//         signInBtn.style.visibility = "hidden";
//         facebookSignInBtn.style.visibility = "hidden";

//         signOutBtn.style.display = "block";
//         whenSignedIn.style.display = "block";
//         whenSignedOut.style.display = "none";
//         signInBtn.style.display = "none";
//         facebookSignInBtn.style.display = "none";

//         // Personalize userDetails section for each user

//         userDetails.innerHTML = `<img src="${user.photoURL}" style="width: 64px; height: 64px; border-radius: 50%"><br><h3>Hello ${user.displayName}! You are currently signed in</h3> <p>Your User ID is ${user.uid}</p><br><p>${user.email ? user.email : ''}</p><br><p> ${user.phoneNumber ? user.phoneNumber : ''}</p>`;

//     } else {

//         // This is what is shown to the user when it's not signed in

//         whenSignedIn.style.visibility = "hidden";
//         whenSignedOut.style.visibility = "visible";
//         userDetails.innerHTML = '';

//         signOutBtn.style.display = "none"
//         whenSignedIn.style.display = "none";
//         whenSignedOut.style.display = "block";

//         // Unsubscribe when the user signs out
//         // personalMarkerSubscribe && publicMarkerSubscribe && unsubscribe();

//     }
// });
</script>

<template>
    <h3>ajsdjasdj</h3>
    <button id="signInBtn">Sign In</button>
    <button id="signOutBtn">Sign Out</button>


</template>