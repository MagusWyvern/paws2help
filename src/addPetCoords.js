import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

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

function readValueById(id) {
    const element = document.getElementById(id)
    return typeof element?.value === 'string' ? element.value.trim() : ''
}

function clearValueById(id) {
    const element = document.getElementById(id)
    if (element && 'value' in element) {
        element.value = ''
    }
}

export async function addPetCoords(latitudeToFetch, longitudeToFetch, userUID) {

    let url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitudeToFetch}&lon=${longitudeToFetch}&zoom=18&addressdetails=1`;

    // Logging: Logs the URL to fetch from nominatim
    // console.info('URL to fetch: ' + url);

    let addressDisplayName
    let generatedUID = generateId(20)

    await fetch(url).then(response => response.json()).then(data => { addressDisplayName = data.display_name });

    console.info('Address: ' + addressDisplayName);

    const listingIntent = readValueById('listingIntent')
    const isDonating = listingIntent === 'give'
    const creatorName = readValueById('creatorName')
    const creatorPhone = readValueById('creatorPhone')
    const petImage = readValueById('petImage')
    const petSpecies = readValueById('petSpecies')
    const contactMethod = readValueById('contactMethod')
    const contactTime = readValueById('contactTime')
    const listingNotes = readValueById('listingNotes')
    const petAge = readValueById('petAge')
    const vaccinationStatus = readValueById('vaccinationStatus')
    const petTemperament = readValueById('petTemperament')
    const rehomingReason = readValueById('rehomingReason')
    const adoptionRequirements = readValueById('adoptionRequirements')
    const homeType = readValueById('homeType')
    const existingPets = readValueById('existingPets')
    const preferredPetAge = readValueById('preferredPetAge')
    const canHandleMedical = readValueById('canHandleMedical')

    // Create a new document at the Firestore collection with the inputted data
    await setDoc(doc(db, "pet-coords", generatedUID), {
        buttonDocID: generatedUID,
        coords: [latitudeToFetch, longitudeToFetch],
        uid: userUID,
        donate: isDonating,
        listingIntent,
        createdAt: serverTimestamp(),
        addressName: addressDisplayName,
        creatorName,
        creatorPhone,
        petImage,
        petSpecies,
        contactMethod,
        contactTime,
        listingNotes,
        petAge,
        vaccinationStatus,
        petTemperament,
        rehomingReason,
        adoptionRequirements,
        homeType,
        existingPets,
        preferredPetAge,
        canHandleMedical,
    });

    // Clear the form

    clearValueById('creatorName')
    clearValueById('creatorPhone')
    clearValueById('petImage')
    clearValueById('petSpecies')
    clearValueById('contactMethod')
    clearValueById('contactTime')
    clearValueById('listingNotes')
    clearValueById('petAge')
    clearValueById('vaccinationStatus')
    clearValueById('petTemperament')
    clearValueById('rehomingReason')
    clearValueById('adoptionRequirements')
    clearValueById('homeType')
    clearValueById('existingPets')
    clearValueById('preferredPetAge')
    clearValueById('canHandleMedical')
}
