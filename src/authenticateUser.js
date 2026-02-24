import { getRedirectResult, signInWithRedirect, signOut } from 'firebase/auth'
import { auth, provider } from './firebase'

let user = null

export function setupHTMLHandlers({ signInButton, signOutButton }) {
    if (signInButton) {
        signInButton.onclick = () => signInWithRedirect(auth, provider)
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
    return user
}
