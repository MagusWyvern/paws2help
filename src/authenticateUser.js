import { getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { auth, provider } from './firebase'

let user = auth.currentUser || null

onAuthStateChanged(auth, (currentUser) => {
    user = currentUser || null
})

async function startSignIn() {
    try {
        await signInWithPopup(auth, provider)
    } catch (error) {
        const shouldFallbackToRedirect = error?.code === 'auth/popup-blocked' ||
            error?.code === 'auth/operation-not-supported-in-this-environment'

        if (shouldFallbackToRedirect) {
            await signInWithRedirect(auth, provider)
            return
        }

        if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
            return
        }

        console.error('Sign-in failed:', error)
    }
}

export function setupHTMLHandlers({ signInButton, signOutButton }) {
    if (signInButton) {
        signInButton.onclick = () => startSignIn()
    }

    if (signOutButton) {
        signOutButton.onclick = async () => {
            await signOut(auth)
        }
    }

    return getRedirectResult(auth)
        .then((result) => {
            if (result && result.user) {
                user = result.user
            }
            return result
        })
        .catch((error) => {
            console.error('Sign-in redirect processing failed:', error)
            return null
        })
}

export function setCurrentUser(passedUser) {
    user = passedUser || null
}

export function getCurrentUser() {
    return auth.currentUser || user || null
}
