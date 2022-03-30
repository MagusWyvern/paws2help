var userlatitude = 0;
var userlongitude = 0;
var mymap = 0;
var position = {
    coords:
    {
        lat: 0,
        lng: 0
    }
}
var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

var catIcon = L.icon({
    iconUrl: './map-icons/cat-solid.svg',
    shadowUrl: 'shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

mymap = L.map('mapid').setView([3.140853, 101.693207], 13);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoibWFndXN3eXZlcm4iLCJhIjoiY2tzNGFweDNrMDFpMzJwbWxpZmlmMHhmciJ9.Itc6X_zrrrRfUj7GwwXP8w'
}).addTo(mymap);

function getLocation() {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error, options);

    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

function success(position) {

    userlatitude = position.coords.latitude;
    userlongitude = position.coords.longitude;

    // Debugging
    console.log(position.coords.latitude);
    console.log(position.coords.longitude);

    loadMap();

}

function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

function loadMap() {

    mymap.setView([userlatitude, userlongitude], 10);

    // Circle marker, used for stray animals

    var circle = L.circle([2.707465, 101.946087], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 100
    }).addTo(mymap);

    circle.bindPopup("Stray cats around this area.");

    var popup = L.popup();

    // Debugging coords, comment out this section of code for production

    function onMapClick(e) {
        popup
            .setLatLng(e.latlng)
            .setContent("You clicked the map at " + e.latlng.toString())
            .openOn(mymap);
    }

    mymap.on('click', onMapClick);

    // Initialize the custom icons

    var dogIcon = L.icon({
        iconUrl: './map-icons/dog-solid.svg',
        shadowUrl: 'shadow.svg',

        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });

    var catIcon = L.icon({
        iconUrl: './map-icons/cat-solid.svg',
        shadowUrl: 'shadow.svg',

        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });

    var birdIcon = L.icon({
        iconUrl: './map-icons/dove-solid.svg',
        shadowUrl: 'shadow.svg',

        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });

    var helpIcon = L.icon({
        iconUrl: './map-icons/paw-solid.svg',
        shadowUrl: 'shadow.svg',

        iconSize: [45, 50], // size of the icon
        shadowSize: [50, 64], // size of the shadow
        iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
        shadowAnchor: [4, 62],  // the same for the shadow
        popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });

    // Add the markers to the map

    // Veterinar clinics

    L.marker([2.734557, 101.951923], { icon: helpIcon }).addTo(mymap).bindPopup("Klinik Veterinar XYZ Seremban is offering help.");

    L.marker([5.399737, 101.678467], { icon: helpIcon }).addTo(mymap).bindPopup("Klinik Veterinar XYZ Seremban is offering help.");

    // Cats

    L.marker([5.182659, 100.942383], { icon: catIcon }).addTo(mymap).bindPopup("Pn. Aminah is donating cats.");

    L.marker([2.320514, 103.117676], { icon: catIcon }).addTo(mymap).bindPopup("En. Adam is looking for cats.");

    L.marker([3.734101, 102.365112], { icon: catIcon }).addTo(mymap).bindPopup("En. Adam is looking for cats.");

    // Dogs

    L.marker([4.985423, 102.414551], { icon: dogIcon }).addTo(mymap).bindPopup("Ms. Cheoo is donating dogs.");

    L.marker([4.29493, 102.282715], { icon: dogIcon }).addTo(mymap).bindPopup("Ms. Cheoo is donating dogs.");

    // Birds

    L.marker([4.174806, 101.535645], { icon: birdIcon }).addTo(mymap).bindPopup("En. Adam is looking for birds.");

    L.marker([4.448272, 102.689209], { icon: birdIcon }).addTo(mymap).bindPopup("En. Adam is looking for birds.");



}




// const updateCenter = document.getElementById('update-center');

// updateCenter.onclick = function () { L.marker([mymap.getCenter().lat, mymap.getCenter().lng]).addTo(mymap) };

// Handle PWA installation

let deferredPrompt;
const addBtn = document.querySelector('#add-button');
addBtn.style.display = 'none';

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    addBtn.style.display = 'block';

    addBtn.addEventListener('click', (e) => {
        // hide our user interface that shows our A2HS button
        addBtn.style.display = 'none';
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

const locationBtn = document.querySelector('#location-button');

if (position.coords.latitude && position.coords.longitude) {

    locationBtn.addEventListener("click", getLocation());
} else {
    position.coords.latitude = 1.5;
    position.coords.longitude = 103.5;
}

// Firebase Implementation starts here

const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

/// Sign in event handlers

signInBtn.onclick = () => auth.signInWithPopup(provider);

signOutBtn.onclick = () => auth.signOut();
const createThing = document.getElementById('createThing');
const coordsList = document.getElementById('coordsList');

const db = firebase.firestore();

let thingsRef;
let unsubscribe;

const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');
const userDetails = document.getElementById('userDetails');

var markers = new Array();

auth.onAuthStateChanged(user => {
    if (user) {
        // signed in
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        signInBtn.hidden = true;
        userDetails.innerHTML = `<h3>Hello ${user.displayName}! You are currently signed in</h3> <p>Your User ID is: ${user.uid}</p><br>`;

        // Database Reference
        thingsRef = db.collection('pet-coords')

        createThing.onclick = () => {

            const { serverTimestamp } = firebase.firestore.FieldValue;

            // Set donate to true if user checked the tickbox

            thingsRef.add({
                coords: [mymap.getCenter().lat, mymap.getCenter().lng],
                uid: user.uid,
                donate: document.getElementById('donate').checked,
                createdAt: serverTimestamp()
            });
        }

        // Query
        unsubscribe = thingsRef.where('uid', '==', user.uid)
            .onSnapshot(querySnapshot => {

                // Map results to an array of li elements

                const items = querySnapshot.docs.map(doc => {
                    


                    var LamMarker = new L.marker([doc.data().coords[0], doc.data().coords[1]], { icon: catIcon }).bindPopup(`${doc.data().donate ? 'I am donating' : 'I am looking for'} cats.`);
    
                    markers.push(LamMarker);
    
                    mymap.addLayer(markers[markers.length - 1])
    
                    console.log(markers)


                    return `
                    <div class="box">
                        <div class="columns">

                            <div class="column">
                                <li id="${doc.id}">${doc.data().coords[0]} + ${doc.data().coords[1]}</li>
                            </div>
     
                            <div class="column">
                                <button data-docid="${doc.id}" id="deleteBtn" class="button" onclick="deleteDocbyID(this)">Delete</button>
                            </div>

                        </div>
                    </div>
                    `;

                });


                coordsList.innerHTML = items.join('');

            });

           
    } else {
        // not signed in
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        userDetails.innerHTML = '';

        // Unsubscribe when the user signs out
        unsubscribe && unsubscribe();
    }
});

async function deleteDocbyID(button) {
    // Delete a coordinate using the id of the x icon
    id = button.getAttribute('data-docid');


    // Also delete the marker that matches the coords in the document by checking it against the markers array
    // Create separate variables for the latitude and longitude in the document

    var docu = await thingsRef.doc(id).get();

    // Loop through the markers array and find the marker that matches the coords of the document
    for (let i = 0; i < markers.length; i++) {
        if (markers[i]._latlng.lat == docu.data().coords[0] && markers[i]._latlng.lng == docu.data().coords[1]) {
            // Remove the marker from the map
            mymap.removeLayer(markers[i])
            // Remove the marker from the array
            markers.splice(i, 1);
            break;
        }
    }

    // Finally, delete the document
    await thingsRef.doc(id).delete();
}

