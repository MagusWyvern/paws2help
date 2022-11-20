<script setup>
import 'bulma/css/bulma.css'
import PageHero from './components/PageHero.vue'
import AuthenticationSection from './components/AuthenticationSection.vue';
import MapView from './components/MapView.vue'
import PetListing from './components/PetListing.vue'

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

</script>

<template>
  <header>
    <PageHero msg="Paws2Help" />
  </header>

  <div class="block">

  </div>

  <div class="box">
    <h1 class="title is-4">What is this app for?</h1>

    <p class="subtitle is-6"> Paws2Help is a simple web application that allows you to give and adopt cats. You can view
      current listings on the map view below which shows people that are either ready to receive cats or people that
      wants to give their pets out for adoption We hope to reduce
      the number of neglected stray cats living in the streets!</p>
  </div>

  <AuthenticationSection />


  <MapView />

  <PetListing />

  <article class="message is-warning">
    <div class="message-header">
      <p>Reminder</p>
      <button class="delete" aria-label="delete"></button>
    </div>
    <div class="message-body">
      Paws2Help is still in Alpha Development, bugs and errors may appear. Feel free to report them <a
        href="mailto:maguswyvern@gmail.com">here!</a>
    </div>
  </article>

</template>

<style scoped>

</style>
