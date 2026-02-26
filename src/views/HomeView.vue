<script setup>
import MapView from '../components/MapView.vue'
import PetListing from '../components/PetListing.vue'

const stats = [
  { label: 'Reports of stray animals', value: 24 },
  { label: 'Listings', value: 9 },
  { label: 'Pet types supported', value: 1 },
]
</script>

<template>
  <section class="home-layout">
    <section class="box app-intro">
      <div class="intro-content">
        <img
          class="intro-image"
          src="/melina-kiefer-BcfS-YvFVQw-unsplash.jpg"
          alt="Stray cats resting outdoors"
        >
        <p class="subtitle is-6">
          Paws2Help is a simple web application that allows you to give and adopt cats. You can view
          current listings on the map, which shows people that are either ready to receive cats or people
          that want to give their pets out for adoption. We hope to reduce the number of neglected stray
          cats living in the streets.
        </p>
      </div>
    </section>

    <section class="reports">
      <h2 class="title is-5">Community Reports</h2>

      <div class="report-grid">
        <article v-for="stat in stats" :key="stat.label" class="report-card">
          <p class="report-label">{{ stat.label }}</p>
          <p class="report-value">{{ stat.value }}</p>
        </article>
      </div>
    </section>

    <MapView />
    <PetListing />
  </section>
</template>

<style scoped>
.home-layout {
  margin-top: 2rem;
}

.app-intro {
  margin: 2rem 1rem;
  padding: 1rem;
}

.intro-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.intro-image {
  width: 100%;
  height: min(60vh, 520px);
  object-fit: cover;
  border-radius: 0.75rem;
}

.reports {
  margin: 0 1rem 1.5rem;
}

.report-note {
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.9rem;
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.report-card {
  background: #f8f8ff;
  border: 1px solid #e6e6f7;
  border-radius: 0.75rem;
  padding: 1rem;
}

.report-label {
  margin: 0;
  color: #666;
}

.report-value {
  margin: 0.3rem 0 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #3d3b8e;
}
</style>
