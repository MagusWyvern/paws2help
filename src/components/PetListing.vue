<script>
import { ref, onMounted } from 'vue';
import { FieldValue } from 'firebase/firestore'


onMounted(() => {
async function addPetCoords() {

    // Use the server timestamp instead of client so that the data stays consistent

    const { serverTimestamp } = firebase.firestore.FieldValue;

    url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${mymap.getCenter().lat}&lon=${mymap.getCenter().lng}&zoom=18&addressdetails=1`;

    // Debugging
    // console.info('URL to fetch: ' + url);
    // console.info('Latitude to fetch:' + mymap.getCenter().lat);
    // console.info('Longitude to fetch:' + mymap.getCenter().lng);

    await fetch(url).then(response => response.json()).then(data => { addressDisplayName = data.display_name });

    console.info('Address: ' + addressDisplayName);

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
}

async function deleteDocbyID(button) {
    // Delete a coordinate using the id of the x icon
    id = button.getAttribute('data-docid');

    // Get the coords from the doc id 
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

    // Finally, delete the document
    await petCoordsRef.doc(id).delete();


}


    let createThing = document.getElementById('createThing')

    createThing.onclick = () => {
    
        addPetCoords();
    
    }

})


</script>

<template>

    <div class="column is-full">

        <div class="box">

            <h3 class="title">Listing Form</h3>

            <p>Full Name</p>
            <input class="input" type="text" placeholder="Your name" id="creatorName"><br><br>

            <p>Phone Number</p>
            <input id="creatorPhone" class="input" type="text" placeholder="Your number"><br><br>

            <p>Pet Image</p>
            <sub>You can upload the image to <a href="https://imgur.com/">imgur</a> or <a
                    href="https://imgbb.com/">imgBB</a> and share the link here!</sub>
            <input id="petImage" class="input" type="text" placeholder="Your image url"><br><br>

            <p>I am donating pets 📤 <input type="checkbox" id="donate" name="donate" value="true"></p><br>
            <p class="description">I want to adopt pets 📥 <input type="checkbox" id="adopt" name="adopt" value="true">
            </p>
            <br>

            <p class="description">When you're ready, tap the button to list your current location on the map!</p>
            <sub>Make sure your address is at the center of the map view!</sub><br>
            <button id="createThing" class="button is-primary">Mark my location on the map</button>

        </div>

    </div>
</template>

<style>

</style>