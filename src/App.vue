<script setup>
import 'bulma/css/bulma.css'
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import PageHero from './components/PageHero.vue'
import Footer from './components/Footer.vue'

onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
  }
})

</script>

<template>
  <header>
    <PageHero msg="Paws2Help" />
  </header>

  <main>
    <RouterView />
  </main>

  <Footer />
</template>
