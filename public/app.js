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
var popup = L.popup();
var options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
};

var dogIcon = L.icon({
    iconUrl: './map-icons/dog-solid.svg',
    shadowUrl: 'shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var birdIcon = L.icon({
    iconUrl: './map-icons/dove-solid.svg',
    shadowUrl: 'shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var helpIcon = L.icon({
    iconUrl: './map-icons/paw-solid.svg',
    shadowUrl: 'shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [10, -30] // point from which the popup should open relative to the iconAnchor
});

var catIcon = L.icon({
    iconUrl: './map-icons/cat-solid.svg',
    shadowUrl: 'shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [10, 45], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [10, -30] // point from which the popup should open relative to the iconAnchor
});

mymap = L.map('mapid').setView([4.225128, 102.249195], 8);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoibWFndXN3eXZlcm4iLCJhIjoiY2tzNGFweDNrMDFpMzJwbWxpZmlmMHhmciJ9.Itc6X_zrrrRfUj7GwwXP8w',
}).addTo(mymap);

var circle = L.circle([2.707465, 101.946087], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 100
}).addTo(mymap);

circle.bindPopup("Stray cats around this area.");

// Veterinar clinics

// L.marker([2.734557, 101.951923], { icon: helpIcon, draggable: true, autoPan: true }).addTo(mymap).bindPopup("Klinik Veterinar XYZ Seremban is offering help.");

// L.marker([5.399737, 101.678467], { icon: helpIcon }).addTo(mymap).bindPopup("Klinik Veterinar XYZ Seremban is offering help.");

function getLocation() {


}

function success(position) {

    userlatitude = position.coords.latitude;
    userlongitude = position.coords.longitude;

    // Debugging
    console.log(position.coords.latitude);
    console.log(position.coords.longitude);

    updateMap();

}

function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
}

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(mymap);
}

mymap.on('click', onMapClick);


function updateMap() {
    mymap.setView([userlatitude, userlongitude], 15);
}

const locationBtn = document.querySelector('#location-button');

locationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error, options);

    } else {
        alert('Geolocation is not supported by this browser.');
    }
});

function eventFire(el, etype) {
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
}

// Firebase Implementation starts here

const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const facebookSignInBtn = document.getElementById('facebookSignInBtn');

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const facebookProvider = new firebase.auth.FacebookAuthProvider();

/// Sign in event handlers

signInBtn.onclick = () => auth.signInWithPopup(provider);
facebookSignInBtn.onclick = () => auth.signInWithPopup(facebookProvider);

signOutBtn.onclick = () => auth.signOut() && location.reload();
const createThing = document.getElementById('createThing');
const coordsList = document.getElementById('coordsList');

const db = firebase.firestore();

let petCoordsRef;
let unsubscribe;

const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');
const userDetails = document.getElementById('userDetails');

var markers = new Array();
var addressDisplayName = "Street adress not found, you may delete this address";
var url = 1
var count = 0
var markerClusters = L.markerClusterGroup()

mymap.addLayer(markerClusters)

auth.onAuthStateChanged(user => {
    if (user) {
        // signed in
        whenSignedIn.style.visibility = "visible";
        whenSignedOut.style.visibility = "hidden";
        signInBtn.style.visibility = "hidden";
        facebookSignInBtn.style.visibility = "hidden";

        signOutBtn.style.display = "block";
        whenSignedIn.style.display = "block";
        whenSignedOut.style.display = "none";
        signInBtn.style.display = "none";
        facebookSignInBtn.style.display = "none";


        userDetails.innerHTML = `<img src="${user.photoURL}" style="width: 64px; height: 64px; border-radius: 50%"><br><h3>Hello ${user.displayName}! You are currently signed in</h3> <p>Your User ID is ${user.uid}</p><br><p>${user.email ? user.email : ''}</p><br><p> ${user.phoneNumber ? user.phoneNumber : ''}</p>`;

        // Database Reference
        petCoordsRef = db.collection('pet-coords')

        async function addPetCoords() {
            const { serverTimestamp } = firebase.firestore.FieldValue;

            url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${mymap.getCenter().lat}&lon=${mymap.getCenter().lng}&zoom=18&addressdetails=1`;

            console.info('URL to fetch: ' + url);
            console.info('Latitude to fetch:' + mymap.getCenter().lat);
            console.info('Longitude to fetch:' + mymap.getCenter().lng);

            await fetch(url).then(response => response.json()).then(data => { addressDisplayName = data.display_name });

            console.info('Address: ' + addressDisplayName);

            // Set donate to true if user checked the tickbox

            await petCoordsRef.add({
                coords: [mymap.getCenter().lat, mymap.getCenter().lng],
                uid: user.uid,
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

            // location.reload()
        }
        createThing.onclick = () => {

            addPetCoords();

        }

        // Query
        unsubscribe = petCoordsRef.where('uid', '==', user.uid)
            .onSnapshot(querySnapshot => {

                const items = querySnapshot.docs.map(doc => {

                    // Use the reverse geocoding API to display it in the list

                    if (doc.data().uid == user.uid) {
                        return `
                    <div class="box">
                        <div class="columns">

                            <div class="column">
                                <li id="${doc.id}">Latitude: ${doc.data().coords[0]}, Longitude: ${doc.data().coords[1]}</li>
                                <strong>${doc.data().addressName.toLocaleString()}</strong> <br>
                                <small>${doc.data().createdAt.toDate().toDateString()}</small>
                            </div>
     
                            <div class="column">
                                <button data-docid="${doc.id}" id="deleteBtn" class="button" onclick="deleteDocbyID(this)">Delete</button>
                            </div>

                        </div>
                    </div>
                    `} else {
                    }

                    ;

                });

                coordsList.innerHTML = items.join('');

            });

        // ------------

            console.log("Here!")
        unsubscribe2 = petCoordsRef
            .onSnapshot(querySnapshot => {

                querySnapshot.docs.map(docs => {

                    if (docs.data().petImage == undefined) {
                        petImage = "./blank-cat.jpg"
                    } else {
                        petImage = docs.data().petImage

                    }


                    if (docs.data().creatorName == undefined) {
                        creatorName = "Anonymous"
                    } else {
                        creatorName = docs.data().creatorName
                    }


                    if (docs.data().creatorPhone == undefined) {
                        creatorPhone = "No phone number provided"
                    } else {
                        creatorPhone = docs.data().creatorPhone
                    }

                    var newMarker = new L.marker([docs.data().coords[0], docs.data().coords[1]], { icon: catIcon }).bindPopup(`${docs.data().donate ? 'I am donating' : 'I am looking for'} cats!<br>Adress: ${docs.data().addressName}<br>Name: ${creatorName}<br>Phone Number: ${creatorPhone}<br><img src="${petImage}" style="width: 84px; height: 84px; border-radius: 50%">`);

                    // Compare the new marker against every marker in the array

                    console.log(newMarker)

                    if (markers.includes(newMarker) == false) {
                        markers.push(newMarker);
                        markerClusters.addLayer(newMarker);
                    } else {
                        console.info('Marker already exists');
                    }

                });

                for (let i = 0; i < markers.length; i++) {
                    if (markers[i] != markerClusters[i]) {
                        markerClusters.addLayer(markers[i]);
                    } else {
                        console.info('Marker already in cluster')
                    }
                }

                console.info('Current markers array length: ' + markers.length)

            });

        mymap.addLayer(markerClusters)

    } else {

        // This is what is shown to the user when it's not signed in
        whenSignedIn.style.visibility = "hidden";
        whenSignedOut.style.visibility = "visible";
        userDetails.innerHTML = '';

        signOutBtn.style.display = "none"
        whenSignedIn.style.display = "none";
        whenSignedOut.style.display = "block";
        // Unsubscribe when the user signs out
        unsubscribe && unsubscribe2 && unsubscribe();

    }
});

async function deleteDocbyID(button) {
    // Delete a coordinate using the id of the x icon
    id = button.getAttribute('data-docid');

    var docIDToDelete = await petCoordsRef.doc(id).get();

    // Loop through the markers array and find the marker that matches the coords of the document
    for (let i = 0; i < markers.length; i++) {
        if (markers[i]._latlng.lat == docIDToDelete.data().coords[0] && markers[i]._latlng.lng == docIDToDelete.data().coords[1]) {
            // Remove the marker from the map
            markerClusters.removeLayer(markers[i])
            // Remove the marker from the array
            markers.splice(i, 1);
            break;
        }
    }

    // Make sure the map only shows the markers that are left in the firestore collection



    // Finally, delete the document
    await petCoordsRef.doc(id).delete();


}

