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

var catIcon = L.icon({
    iconUrl: './map-icons/cat-solid.svg',
    shadowUrl: 'shadow.svg',

    iconSize: [45, 50], // size of the icon
    shadowSize: [50, 64], // size of the shadow
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

mymap = L.map('mapid').setView([3.140853, 101.693207], 13);

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

L.marker([2.734557, 101.951923], { icon: helpIcon }).addTo(mymap).bindPopup("Klinik Veterinar XYZ Seremban is offering help.");

L.marker([5.399737, 101.678467], { icon: helpIcon }).addTo(mymap).bindPopup("Klinik Veterinar XYZ Seremban is offering help.");

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

function eventFire(el, etype){
    if (el.fireEvent) {
      el.fireEvent('on' + etype);
    } else {
      var evObj = document.createEvent('Events');
      evObj.initEvent(etype, true, false);
      el.dispatchEvent(evObj);
    }
  }

// if (position.coords.latitude && position.coords.longitude) {

// } else {
//     console.warn('Unable to get user location')
// }


// const updateCenter = document.getElementById('update-center');

// updateCenter.onclick = function () { L.marker([mymap.getCenter().lat, mymap.getCenter().lng]).addTo(mymap) };

// Firebase Implementation starts here

const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

/// Sign in event handlers

signInBtn.onclick = () => auth.signInWithPopup(provider);

signOutBtn.onclick = () => auth.signOut() && location.reload();
const createThing = document.getElementById('createThing');
const coordsList = document.getElementById('coordsList');

const db = firebase.firestore();

let thingsRef;
let unsubscribe;

const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');
const userDetails = document.getElementById('userDetails');

var markers = new Array();
var addressDisplayName = "Street adress not found, you may delete this address";
var url = 1
var count = 0

auth.onAuthStateChanged(user => {
    if (user) {
        // signed in
        whenSignedIn.style.visibility = "visible";
        whenSignedOut.style.visibility = "hidden";
        signInBtn.style.visibility = "hidden";
        signOutBtn.style.display = "block";
        userDetails.innerHTML = `<img src="${user.photoURL}" style="width: 64px; height: 64px; border-radius: 50%"><br><h3>Hello ${user.displayName}! You are currently signed in</h3> <p>Your User ID is ${user.uid}</p><br><p>${user.email ? user.email : ''}</p><br><p>${user.phoneNumber ? user.phoneNumber : ''}</p>`;

        // Database Reference
        thingsRef = db.collection('pet-coords')

        async function addPetCoords() {
            const { serverTimestamp } = firebase.firestore.FieldValue;

            url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${mymap.getCenter().lat}&lon=${mymap.getCenter().lng}&zoom=18&addressdetails=1`;
        
            console.info('URL to fetch: ' + url);
            console.info('Latitude:' + mymap.getCenter().lat);
            console.info('Longitude:' + mymap.getCenter().lng);
        
            await fetch(url).then(response => response.json()).then(data => { addressDisplayName = data.display_name });
        
            console.info('Address: ' + addressDisplayName);

            // Set donate to true if user checked the tickbox

            await thingsRef.add({
                coords: [mymap.getCenter().lat, mymap.getCenter().lng],
                uid: user.uid,
                donate: document.getElementById('donate').checked,
                createdAt: serverTimestamp(),
                addressName: addressDisplayName,
                creatorName: document.getElementById('creatorName').value,
                creatorPhone: document.getElementById('creatorPhone').value, 
                // Grab phone number from form
            });
        }
        createThing.onclick = () => {



            addPetCoords();
            
        }

        // Query
        unsubscribe = thingsRef.where('uid', '==', user.uid)
            .onSnapshot(querySnapshot => {

                // Map results to an array of li elements

                const items = querySnapshot.docs.map(doc => {

                    var LamMarker = new L.marker([doc.data().coords[0], doc.data().coords[1]], { icon: catIcon }).bindPopup(`${doc.data().donate ? 'I am donating' : 'I am looking for'} cats.<br>${doc.data().addressName}<br>${doc.data().creatorName}<br>${doc.data().creatorPhone}`);

                    markers.push(LamMarker);

                    mymap.addLayer(markers[markers.length - 1])

                    // Use the reverse geocoding API to display it in the list

                    data = {
                        "place_id": 201144398,
                        "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
                        "osm_type": "way",
                        "osm_id": 436312094,
                        "lat": "3.140824522372358",
                        "lon": "101.69319329201915",
                        "display_name": "KTM Roundabout, Brickfields, Kuala Lumpur, 50000, Malaysia",
                        "address":
                        {
                            "road": "KTM Roundabout",
                            "suburb": "Brickfields",
                            "city": "Kuala Lumpur",
                            "postcode": "50000",
                            "country": "Malaysia",
                            "country_code": "my"
                        },
                        "boundingbox": ["3.1407858", "3.1408392", "101.6931628", "101.6934525"]
                    }




                    return `
                    <div class="box">
                        <div class="columns">

                            <div class="column">
                                <li id="${doc.id}">Latitude: ${doc.data().coords[0]}, Longitude: ${doc.data().coords[1]}</li>
                                <strong>${doc.data().addressName.toLocaleString()}</strong> <br>
                                <small>${doc.data().createdAt.toDate().toLocaleString()}</small>
                            </div>
     
                            <div class="column">
                                <button data-docid="${doc.id}" id="deleteBtn" class="button" onclick="deleteDocbyID(this)">Delete</button>
                            </div>

                        </div>
                    </div>
                    `;

                });


                coordsList.innerHTML = items.join('');

                console.info('Current markers array list: ' + markers)

            });

    } else {
        // not signed in
        whenSignedIn.style.visibility = "hidden";
        whenSignedOut.style.visibility = "visible";
        userDetails.innerHTML = '';
        signOutBtn.style.display = "none"

        // Unsubscribe when the user signs out
        unsubscribe && unsubscribe();

    }
});

async function deleteDocbyID(button) {
    // Delete a coordinate using the id of the x icon
    id = button.getAttribute('data-docid');

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

    // Make sure the map only shows the markers that are left in the firestore collection



    // Finally, delete the document
    await thingsRef.doc(id).delete();

    // location.reload();
}

