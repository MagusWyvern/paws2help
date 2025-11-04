<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const map = L.map('map').setView([3.139, 101.686], 8)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)
})
</script>

<template>
  <nav>
    <li>Home</li>
    <li>About us</li>
    <li>Contact</li>
    <li>Statistics</li>
    <li>Login</li>
  </nav>

  <h1>Paws2Help</h1>

  <p>Paws2Help is a simple web app that allows you to:</p>
  <ul>
    <li>Report the location of stray cats</li>
    <li>List your pets up for adoption</li>
    <li>Adopt pets from existing owners</li>
  </ul>


  <div id="map"></div>

  <p>Stray animals spotted</p>
  <p>Animals listed for adoption</p>
  <p>Animals with new homes</p>


  <p>See an act of Animal Cruelty?</p>

  <button>Report to Department of Veterinarian Service Malaysia</button>
</template>

<style scoped>
#map {
  height: 75vh;
  width: 75vw;
}
</style>
