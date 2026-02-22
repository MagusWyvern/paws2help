import { getRedirectResult, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { auth, provider } from './firebase';

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

export function setCurrentUser(passedUser) {
    user = passedUser
}

export function getCurrentUser() {
    if (user) {
        return user
    } else {
        console.warn("User hasn't logged in yet!")
    }
}
