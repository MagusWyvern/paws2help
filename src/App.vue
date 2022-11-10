<script setup>
import 'bulma/css/bulma.css'
import PageHero from './components/PageHero.vue'
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, getRedirectResult } from 'firebase/auth';

const firebaseApp = initializeApp({
  apiKey: "AIzaSyCxuDGiS-uw2G3Y6keIW85G8v25IeRTaBs",
  authDomain: "petscircle.firebaseapp.com",
  projectId: "petscircle",
  storageBucket: "petscircle.appspot.com",
  messagingSenderId: "195232543538",
  appId: "1:195232543538:web:f5fbb5300ffd876b325d2b",
  measurementId: "G-3PVKXCEFW3"
});
const auth = getAuth(firebaseApp);
console.log(auth)

</script>

<template>
  <header>
    <PageHero msg="Paws2Help" />
  </header>

  <AuthenticationSection />

  <!-- <MapView />

    <PetListing /> -->

</template>

<style scoped>

</style>
