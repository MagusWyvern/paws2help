<script setup>
import { onBeforeUnmount, onMounted } from 'vue';
import { query, collection, onSnapshot, updateDoc, deleteDoc, doc, getDocs, where, writeBatch } from "firebase/firestore";
import { deleteUser } from 'firebase/auth';
import { auth, db } from '../firebase';
import { setCurrentUser, getCurrentUser, resolveUserPhotoURL, setupHTMLHandlers } from '../authenticateUser'

let items
let authUnsubscribe = null
let markersUnsubscribe = null
let reportsUnsubscribe = null

function escapeHTML(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
}

function formatListingType(listingData) {
    return listingData?.donate ? 'Giving away a pet' : 'Looking for a pet'
}

function buildListingShareUrl(listingId) {
    return `${window.location.origin}/map?listing=${encodeURIComponent(listingId)}`
}

async function copyTextToClipboard(textToCopy) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy)
        return
    }

    const fallbackInput = document.createElement('input')
    fallbackInput.value = textToCopy
    document.body.appendChild(fallbackInput)
    fallbackInput.select()
    document.execCommand('copy')
    document.body.removeChild(fallbackInput)
}

function formatListingRows(listingData) {
    const coords = Array.isArray(listingData?.coords) && listingData.coords.length >= 2
        ? `${Number(listingData.coords[0]).toFixed(6)}, ${Number(listingData.coords[1]).toFixed(6)}`
        : ''

    const rows = [
        { label: 'Listing type', value: formatListingType(listingData) },
        { label: 'Pet species/type', value: listingData?.petSpecies || '' },
        { label: 'Name/Nickname', value: listingData?.creatorName || '' },
        { label: 'Phone', value: listingData?.creatorPhone || '' },
        { label: 'Contact method', value: listingData?.contactMethod || '' },
        { label: 'Best contact time', value: listingData?.contactTime || '' },
        { label: 'Coordinates', value: coords },
        { label: 'Notes', value: listingData?.listingNotes || '' },
    ]

    if (listingData?.donate) {
        rows.push(
            { label: 'Pet age', value: listingData?.petAge || '' },
            { label: 'Vaccination/neutered', value: listingData?.vaccinationStatus || '' },
            { label: 'Temperament', value: listingData?.petTemperament || '' },
            { label: 'Rehoming reason', value: listingData?.rehomingReason || '' },
            { label: 'Adoption requirements', value: listingData?.adoptionRequirements || '' },
        )
    } else {
        rows.push(
            { label: 'Home type', value: listingData?.homeType || '' },
            { label: 'Existing pets', value: listingData?.existingPets || '' },
            { label: 'Preferred pet age', value: listingData?.preferredPetAge || '' },
            { label: 'Medical/special needs', value: listingData?.canHandleMedical || '' },
        )
    }

    return rows.filter((row) => typeof row.value === 'string' ? row.value.trim().length > 0 : Boolean(row.value))
}

function renderListingCard(listingId, listingData) {
    const listingRowsMarkup = formatListingRows(listingData)
        .map((row) => `<p class="listing-row"><b>${escapeHTML(row.label)}:</b> ${escapeHTML(row.value)}</p>`)
        .join('')

    const petImage = listingData?.petImage || '../assets/logo.svg'
    const addressName = listingData?.addressName || 'Unknown address'
    const shareUrl = buildListingShareUrl(listingId)

    return `
    <article class="box listing-item">
        <div class="listing-item-head">
            <img src="${escapeHTML(petImage)}" alt="Listing pet image" class="listing-item-image">
            <div class="listing-item-meta">
                <p class="listing-item-address">${escapeHTML(addressName)}</p>
                <p class="listing-item-link is-size-7 has-text-grey">${escapeHTML(shareUrl)}</p>
            </div>
        </div>
        <div class="listing-item-body">
            ${listingRowsMarkup}
        </div>
        <div class="buttons are-small mt-3">
            <button class="button is-light" data-action="share" data-id="${escapeHTML(listingId)}">Share</button>
            <button class="button is-link is-light" data-action="open-map" data-id="${escapeHTML(listingId)}">Open on Map</button>
            <button class="button is-danger is-light" data-action="delete" data-id="${escapeHTML(listingId)}">Delete</button>
        </div>
    </article>
    `
}

function formatAccountCreationDate(user) {
    const creationTime = user?.metadata?.creationTime
    if (!creationTime) {
        return 'Unknown'
    }

    const parsedDate = new Date(creationTime)
    if (Number.isNaN(parsedDate.getTime())) {
        return creationTime
    }

    return parsedDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

onMounted(() => {
    const signInNow = document.getElementById('signInNow')
    const signInButton = document.getElementById('signInButton');
    const userDetails = document.getElementById('userDetails');
    const coordsContainer = document.getElementById('coordsContainer')
    const coordsList = document.getElementById('coordsList')
    const reportsContainer = document.getElementById('reportsContainer')
    const reportsList = document.getElementById('reportsList')
    const accountSections = document.getElementById('accountSections')
    const dangerZoneContainer = document.getElementById('dangerZoneContainer')
    const deleteAllListingsButton = document.getElementById('deleteAllListingsButton')
    const deleteAllReportsButton = document.getElementById('deleteAllReportsButton')
    const deleteAccountButton = document.getElementById('deleteAccountButton')
    const dangerZoneStatus = document.getElementById('dangerZoneStatus')

    setupHTMLHandlers({ signInButton, signOutButton: null })

    signInNow.style.display = "block"
    userDetails.innerHTML = ''
    userDetails.style.display = "none"
    coordsContainer.style.display = "none"
    coordsList.innerHTML = ''
    reportsContainer.style.display = "none"
    reportsList.innerHTML = ''
    accountSections.style.display = "none"
    dangerZoneContainer.style.display = "none"
    dangerZoneStatus.innerHTML = ''

    deleteAllListingsButton.onclick = async () => {
        const currentUser = getCurrentUser()
        if (!currentUser) {
            return
        }

        const shouldDelete = window.confirm('Delete all your pet listings? This cannot be undone.')
        if (!shouldDelete) {
            return
        }

        try {
            const listingsQuery = query(collection(db, 'pet-coords'), where('uid', '==', currentUser.uid))
            const listingsSnapshot = await getDocs(listingsQuery)

            if (listingsSnapshot.empty) {
                dangerZoneStatus.innerHTML = 'No listings to delete.'
                return
            }

            const batch = writeBatch(db)
            listingsSnapshot.forEach((listingDoc) => {
                batch.delete(listingDoc.ref)
            })
            await batch.commit()
            dangerZoneStatus.innerHTML = `Deleted ${listingsSnapshot.size} listing(s).`
        } catch (error) {
            console.error('Failed to delete listings:', error)
            dangerZoneStatus.innerHTML = 'Failed to delete listings.'
        }
    }

    deleteAllReportsButton.onclick = async () => {
        const currentUser = getCurrentUser()
        if (!currentUser) {
            return
        }

        const shouldDelete = window.confirm('Delete all your stray reports? This cannot be undone.')
        if (!shouldDelete) {
            return
        }

        try {
            const reportsQuery = query(collection(db, 'stray-reports'), where('uid', '==', currentUser.uid))
            const reportsSnapshot = await getDocs(reportsQuery)

            if (reportsSnapshot.empty) {
                dangerZoneStatus.innerHTML = 'No reports to delete.'
                return
            }

            const batch = writeBatch(db)
            reportsSnapshot.forEach((reportDoc) => {
                batch.delete(reportDoc.ref)
            })
            await batch.commit()
            dangerZoneStatus.innerHTML = `Deleted ${reportsSnapshot.size} report(s).`
        } catch (error) {
            console.error('Failed to delete reports:', error)
            dangerZoneStatus.innerHTML = 'Failed to delete reports.'
        }
    }

    deleteAccountButton.onclick = async () => {
        const currentUser = getCurrentUser()
        if (!currentUser) {
            return
        }

        const shouldDelete = window.confirm(
            'Delete your account entirely? You may need to sign in again before this succeeds.'
        )
        if (!shouldDelete) {
            return
        }

        try {
            await deleteUser(currentUser)
            dangerZoneStatus.innerHTML = 'Account deleted.'
        } catch (error) {
            console.error('Failed to delete account:', error)
            if (error?.code === 'auth/requires-recent-login') {
                dangerZoneStatus.innerHTML = 'Please sign out and sign in again, then retry account deletion.'
                return
            }
            dangerZoneStatus.innerHTML = 'Failed to delete account.'
        }
    }
    reportsList.onclick = async (event) => {
        const actionButton = event.target.closest('button[data-action]')
        if (!actionButton) {
            return
        }

        const reportId = actionButton.dataset.id
        const action = actionButton.dataset.action
        const currentUser = getCurrentUser()

        if (!currentUser || !reportId) {
            return
        }

        const reportRef = doc(db, 'stray-reports', reportId)

        if (action === 'delete') {
            const shouldDelete = window.confirm('Delete this report?')
            if (!shouldDelete) {
                return
            }

            try {
                await deleteDoc(reportRef)
            } catch (error) {
                console.error('Failed to delete report:', error)
            }
            return
        }

        if (action === 'edit') {
            const currentAnimalType = decodeURIComponent(actionButton.dataset.animalType || '')
            const currentEstimatedCount = decodeURIComponent(actionButton.dataset.estimatedCount || '')
            const currentRegion = decodeURIComponent(actionButton.dataset.region || '')

            const nextAnimalType = window.prompt('Animal type', currentAnimalType)
            if (nextAnimalType === null) {
                return
            }

            const nextEstimatedCountRaw = window.prompt('Estimated number', currentEstimatedCount)
            if (nextEstimatedCountRaw === null) {
                return
            }

            const nextEstimatedCount = Number.parseInt(nextEstimatedCountRaw, 10)
            if (Number.isNaN(nextEstimatedCount) || nextEstimatedCount < 1) {
                window.alert('Estimated number must be at least 1.')
                return
            }

            const nextRegion = window.prompt('Region', currentRegion)
            if (nextRegion === null) {
                return
            }

            if (!nextAnimalType.trim() || !nextRegion.trim()) {
                window.alert('Animal type and region are required.')
                return
            }

            try {
                await updateDoc(reportRef, {
                    animalType: nextAnimalType.trim(),
                    estimatedCount: nextEstimatedCount,
                    region: nextRegion.trim(),
                })
            } catch (error) {
                console.error('Failed to update report:', error)
            }
        }
    }
    coordsList.onclick = async (event) => {
        const actionButton = event.target.closest('button[data-action]')
        if (!actionButton) {
            return
        }

        const listingId = actionButton.dataset.id
        const action = actionButton.dataset.action
        const currentUser = getCurrentUser()

        if (!currentUser || !listingId) {
            return
        }

        if (action === 'share') {
            const shareUrl = buildListingShareUrl(listingId)
            try {
                await copyTextToClipboard(shareUrl)
                window.alert('Listing link copied to clipboard.')
            } catch (error) {
                console.error('Failed to share listing link:', error)
                window.alert('Failed to copy listing link.')
            }
            return
        }

        if (action === 'open-map') {
            window.location.assign(`/map?listing=${encodeURIComponent(listingId)}`)
            return
        }

        if (action === 'delete') {
            const shouldDelete = window.confirm('Delete this listing?')
            if (!shouldDelete) {
                return
            }
            try {
                await deleteDoc(doc(db, 'pet-coords', listingId))
            } catch (error) {
                console.error('Failed to delete listing:', error)
            }
        }
    }

    authUnsubscribe = auth.onAuthStateChanged((user) => {
        if (markersUnsubscribe) {
            markersUnsubscribe()
            markersUnsubscribe = null
        }
        if (reportsUnsubscribe) {
            reportsUnsubscribe()
            reportsUnsubscribe = null
        }

        if (user) {
            console.info("Successfully logged in with UID: " + user.uid)

            setCurrentUser(user)

            // Hide the sign in button when a user is logged in
            signInNow.style.display = "none"
            signInButton.style.visibility = "hidden";
            signInButton.style.display = "none";
            userDetails.style.display = "block"
            coordsContainer.style.display = "block"
            reportsContainer.style.display = "block"
            accountSections.style.display = ""
            dangerZoneContainer.style.display = "block"

            // Personalize userDetails section for each user
            const userPhotoURL = resolveUserPhotoURL(user)
            const userPhotoMarkup = userPhotoURL
                ? `<img src="${userPhotoURL}" class="profile-avatar" referrerpolicy="no-referrer" alt="Profile photo">`
                : `<div class="profile-avatar profile-avatar-fallback">${(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</div>`
            const accountCreationDate = formatAccountCreationDate(user)
            const displayName = user.displayName || 'User'

            userDetails.innerHTML = `
            <section class="account-hero">
                <div class="account-hero-main">
                    ${userPhotoMarkup}
                    <div class="account-hero-meta">
                        <h3 class="title is-4">Hello ${displayName}</h3>
                        <p class="account-meta-row"><b>Email:</b> ${user.email ? user.email : 'Not provided'}</p>
                        <p class="account-meta-row"><b>Member since:</b> ${accountCreationDate}</p>
                    </div>
                </div>
                <div class="account-hero-actions-row">
                    <button id="signOutButton" class="button is-danger">Sign Out</button>
                </div>
            </section>
            `;

            const updatedSignOutButton = document.getElementById('signOutButton')
            setupHTMLHandlers({ signInButton, signOutButton: updatedSignOutButton })
            updatedSignOutButton.style.display = "inline-flex"

            // Query all the markers where the current user made it
            const personalMarkersQuery = query(
                collection(db, "pet-coords"),
                where('uid', '==', user.uid)
            );

            markersUnsubscribe = onSnapshot(personalMarkersQuery, (querySnapshot) => {
                // Empty the list every time a new snapshot is received
                items = []

                querySnapshot.forEach((doc) => {
                    let currentUser = getCurrentUser()

                    if (currentUser && doc.data().uid == currentUser.uid) {
                        items.push(renderListingCard(doc.id, doc.data()))
                    }
                });

                coordsList.innerHTML = items.length > 0
                    ? items.join('')
                    : '<p class="has-text-grey">No pet listings yet. Add one from the map or home page.</p>';
            })

            const personalReportsQuery = query(
                collection(db, "stray-reports"),
                where('uid', '==', user.uid)
            );

            reportsUnsubscribe = onSnapshot(personalReportsQuery, (querySnapshot) => {
                const reports = []

                querySnapshot.forEach((doc) => {
                    let currentUser = getCurrentUser()

                    if (currentUser && doc.data().uid == currentUser.uid) {
                        const timestamp = doc.data().createdAt?.toDate
                            ? doc.data().createdAt.toDate().toLocaleString()
                            : 'Just now'

                        const reportCard = `
                        <article class="box report-item">
                            <p><b>Animal:</b> ${doc.data().animalType}</p>
                            <p><b>Estimated count:</b> ${doc.data().estimatedCount}</p>
                            <p><b>Region:</b> ${doc.data().region}</p>
                            <p class="is-size-7 has-text-grey">Reported: ${timestamp}</p>
                            <div class="buttons are-small mt-3">
                                <button
                                    class="button is-warning is-light"
                                    data-action="edit"
                                    data-id="${doc.id}"
                                    data-animal-type="${encodeURIComponent(doc.data().animalType || '')}"
                                    data-estimated-count="${encodeURIComponent(doc.data().estimatedCount || '')}"
                                    data-region="${encodeURIComponent(doc.data().region || '')}"
                                >
                                    Edit
                                </button>
                                <button
                                    class="button is-danger is-light"
                                    data-action="delete"
                                    data-id="${doc.id}"
                                >
                                    Delete
                                </button>
                            </div>
                        </article>
                        `
                        reports.push(reportCard)
                    }
                })

                reportsList.innerHTML = reports.length > 0
                    ? reports.join('')
                    : '<p class="has-text-grey">No stray reports yet. Submit one from the map page.</p>';
            })
        } else {
            console.info("User is not currently logged in.")

            setCurrentUser(null)

            signInNow.style.display = "block"
            signInButton.style.visibility = "visible"
            signInButton.style.display = "inline-flex"
            userDetails.innerHTML = '';
            userDetails.style.display = "none"
            coordsContainer.style.display = "none"
            coordsList.innerHTML = ''
            reportsContainer.style.display = "none"
            reportsList.innerHTML = ''
            accountSections.style.display = "none"
            dangerZoneContainer.style.display = "none"
            dangerZoneStatus.innerHTML = ''
        }
    })
})

onBeforeUnmount(() => {
    if (authUnsubscribe) {
        authUnsubscribe()
    }

    if (markersUnsubscribe) {
        markersUnsubscribe()
    }

    if (reportsUnsubscribe) {
        reportsUnsubscribe()
    }
})
</script>

<template>
    <div id="signInNow">
        <h1 class="title is-4">Ready to get started?</h1>

        <p class="subtitle is-6">Pet listings and stray-animal reports are available for logged-in users.</p>

        <button id="signInButton" class="button is-success">Sign In with Google</button>
    </div>

    <div class="box" id="userDetails" style="display: none;"></div>
    
    <section id="accountSections" class="columns is-variable is-5 account-sections">
        <section class="column" id="coordsContainer" style="display: none;">
            <div class="box">
                <h1 class="title is-4">Pet Listings</h1>
                <p class="subtitle is-6">Locations you have listed for adoption activity.</p>
                <div id="coordsList"></div>
            </div>
        </section>

        <section class="column" id="reportsContainer" style="display: none;">
            <div class="box">
                <h1 class="title is-4">Stray Animal Reports</h1>
                <p class="subtitle is-6">Your previously submitted stray-animal reports.</p>
                <div id="reportsList"></div>
            </div>
        </section>
    </section>

    <section id="dangerZoneContainer" class="box danger-zone" style="display: none;">
        <h2 class="title is-5 has-text-danger">Danger Zone</h2>
        <p class="subtitle is-6">These actions are destructive and cannot be undone.</p>
        <div class="buttons">
            <button id="deleteAllListingsButton" class="button is-danger is-light">Delete All Listings</button>
            <button id="deleteAllReportsButton" class="button is-danger is-light">Delete All Reports</button>
            <button id="deleteAccountButton" class="button is-danger">Delete Account</button>
        </div>
        <p id="dangerZoneStatus" class="is-size-7 has-text-grey"></p>
    </section>

</template>

<style scoped>
#signInNow {
    margin: 2rem 1rem 1rem;
    padding: 0;
    display: flex;
    align-items: center;
    align-content: center;
    flex-wrap: wrap;
    flex-direction: column;
    text-align: center;
}

.subtitle {
    padding: 0.25rem 0 1rem;
}

#signInNow .subtitle {
    padding: 1rem 0 1.5rem;
}

#userDetails {
    background-color: #85CEFF;
    padding: 1.25rem;
    margin: 0 1rem 1rem;
}

#userDetails :deep(.account-hero) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    width: 100%;
}

#userDetails :deep(.account-hero-main) {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

#userDetails :deep(.account-hero-meta) {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

#userDetails :deep(.account-meta-row) {
    margin: 0;
}

#userDetails :deep(.account-hero-actions-row) {
    display: flex;
    width: 100%;
    justify-content: flex-end;
}

#userDetails :deep(.account-hero-actions-row .button) {
    margin-left: auto;
}

#userDetails :deep(.profile-avatar) {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
}

#userDetails :deep(.profile-avatar-fallback) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #ffffff;
    background: #3273dc;
}

#coordsList {
    padding: 1em 0;
}

#reportsList {
    padding: 1em 0 0;
}

.report-item {
    margin: 0 0 1rem;
    text-align: left;
}

#coordsList :deep(.listing-item) {
    margin: 0 0 1rem;
    text-align: left;
}

#coordsList :deep(.listing-item-head) {
    display: flex;
    gap: 0.75rem;
    align-items: center;
}

#coordsList :deep(.listing-item-image) {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #e5e5e5;
}

#coordsList :deep(.listing-item-meta) {
    min-width: 0;
}

#coordsList :deep(.listing-item-address) {
    margin: 0;
    font-weight: 700;
}

#coordsList :deep(.listing-item-link) {
    margin: 0.15rem 0 0;
    overflow-wrap: anywhere;
}

#coordsList :deep(.listing-item-body) {
    margin-top: 0.7rem;
}

#coordsList :deep(.listing-row) {
    margin: 0.15rem 0;
}

.account-sections {
    margin: 0 1rem;
    margin-top: 0.5rem;
}

.danger-zone {
    margin: 1rem;
    border: 1px solid #f14668;
}

</style>
