<script setup>
import { onMounted } from 'vue'
import Navbar from './components/Navbar.vue'

onMounted(() => {
  const map = L.map('map').setView([3.139, 101.686], 8)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
})
</script>

<template>

  <Navbar />

  <section class="hero">
    <div class="hero-body">
      <p class="title">Paws2Help</p>
      <p class="subtitle">Hero subtitle</p>
    </div>
  </section>

  <section class="box">
    <p>Paws2Help is a simple web app that allows you to:</p>

    <section class="columns">

      <section class="column">Report the location of stray cats</section>
      <section class="column">List your pets up for adoption</section>
      <section class="column">Adopt pets from existing owners</section>
    </section>

  </section>

  <div id="map"></div>

  <section class="columns">
    <section class="column">
      <section class="box">
        <p>Stray animals spotted</p>
      </section>
    </section>
    <section class="column">
      <section class="box">
        <p>Animals listed for adoption</p>
      </section>
    </section>
    <section class="column">
      <section class="box">
        <p>Animals with new homes</p>
      </section>
    </section>
  </section>





  <p>See an act of Animal Cruelty?</p>

  <a href="" class="button">Report to Veterinarian Department of Malaysia</a>
</template>

<style scoped>
#map {
  height: 75vh;
  width: 75vw;
}
</style>
