import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, query, collection, onSnapshot, where } from "firebase/firestore";

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

let user

export function setupHTMLHandlers() {
    signInButton.onclick = () => signInWithRedirect(auth, provider);
    signOutButton.onclick = () => auth.signOut() && location.reload()

    getRedirectResult(auth)
    .then((result) => {

        // This gives you a Google Access Token. You can use it to access Google APIs.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;

        // The signed-in user info.
        user = result.user;

    }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;

        // The email of the user's account used.
        // const email = error.customData.email;

        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
    });
}

getRedirectResult(auth)
    .then((result) => {

        // This gives you a Google Access Token. You can use it to access Google APIs.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;

        // The signed-in user info.
        user = result.user;

    }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;

        // The email of the user's account used.
        // const email = error.customData.email;

        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
    });


export function getCurrentUser() {
    if (user) {
        return user
    } else {
        console.warn("User hasn't logged in yet!")
    }
}