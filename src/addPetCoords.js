import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyCxuDGiS-uw2G3Y6keIW85G8v25IeRTaBs",
    authDomain: "petscircle.firebaseapp.com",
    projectId: "petscircle",
    storageBucket: "petscircle.appspot.com",
    messagingSenderId: "195232543538",
    appId: "1:195232543538:web:f5fbb5300ffd876b325d2b",
    measurementId: "G-3PVKXCEFW3"
};

const firebaseApp = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(firebaseApp);

// Unique Document UID Generator
// dec2hex :: Integer -> String
// i.e. 0-255 -> '00'-'ff'
function dec2hex(dec) {
    return dec.toString(16).padStart(2, "0")
}

// generateId :: Integer -> String
function generateId(len) {
    var arr = new Uint8Array((len || 40) / 2)
    window.crypto.getRandomValues(arr)
    return Array.from(arr, dec2hex).join('')
}

export async function addPetCoords(latitudeToFetch, longitudeToFetch, userUID) {

    let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitudeToFetch}&lon=${longitudeToFetch}&zoom=18&addressdetails=1`;

    // Logging: Logs the URL to fetch from nominatim
    // console.info('URL to fetch: ' + url);

    let addressDisplayName

    await fetch(url).then(response => response.json()).then(data => { addressDisplayName = data.display_name });

    console.info('Address: ' + addressDisplayName);

    // Create a new document at the Firestore collection with the inputted data
    await setDoc(doc(db, "pet-coords", generateId(20)), {
        coords: [latitudeToFetch, longitudeToFetch],
        uid: userUID,
        donate: document.getElementById('donate').checked,
        createdAt: serverTimestamp(),
        addressName: addressDisplayName,
        creatorName: document.getElementById('creatorName').value,
        creatorPhone: document.getElementById('creatorPhone').value,
        petImage: document.getElementById('petImage').value,
    });

    // Clear the form

    document.getElementById('creatorName').value = '';
    document.getElementById('creatorPhone').value = '';
    document.getElementById('petImage').value = '';
    document.getElementById('donate').checked = false;
}