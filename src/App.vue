<script setup>
import 'bulma/css/bulma.css'
import PageHero from './components/PageHero.vue'
import AuthenticationSection from './components/AuthenticationSection.vue';
import MapView from './components/MapView.vue'
import PetListing from './components/PetListing.vue'
import Footer from './components/Footer.vue'


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}


</script>

<template>
  <header>
    <PageHero msg="Paws2Help" />
  </header>

  <div class="block"></div>

  <div class="notification is-warning">
    <!-- <button class="delete"></button> -->
As of 29th December 2022, this project has been put on hiatus. Be aware that there may be delays in processing your help requests.
  </div>

  <div class="block"></div>

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

  <Footer />
</template>

<style scoped>
div .box {
  padding-left: 2em;
}

div .message-header {
  padding-left: 2em;
}
</style>
