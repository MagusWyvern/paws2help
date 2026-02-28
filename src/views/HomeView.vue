<script setup>
import MapView from '../components/MapView.vue'
import PetListing from '../components/PetListing.vue'

const stats = [
  { label: 'Community reports submitted', value: 24 },
  { label: 'Active listings', value: 9 },
  { label: 'Pet types supported', value: 10 },
]
</script>

<template>
  <section class="home-layout">
    <section class="box app-intro">
      <div class="intro-content">
        <img
          class="intro-image"
          src="/melina-kiefer-BcfS-YvFVQw-unsplash.jpg"
          alt="Stray pets resting outdoors"
        >
        <div class="intro-text">
          <h1 class="title is-4">Find a Safe Home for Every Pet</h1>
          <p class="subtitle is-6">
            Paws2Help connects people across Malaysia who are giving pets up for adoption and people ready
            to adopt. Browse nearby listings on the map, post your own listing in minutes, and help reduce
            the number of neglected pets on the streets.
          </p>
        </div>
      </div>
    </section>

    <section class="box text-block">
      <h2 class="title is-5">Why Paws2Help Exists</h2>
      <p>
        Too many pets are abandoned, overlooked, or left without support. Paws2Help gives communities a
        practical way to act by matching responsible adopters with pet owners and local rescuers.
      </p>
    </section>

    <section class="box text-block">
      <h2 class="title is-5">How It Works</h2>
      <ol>
        <li>Create a listing to give a pet up for adoption or to find one to adopt.</li>
        <li>Pin your location so nearby users can discover your listing quickly.</li>
        <li>Chat, confirm details, and arrange a safe handover.</li>
      </ol>
    </section>

    <section class="reports">
      <h2 class="title is-5">Community Reports</h2>
      <p class="report-note">
        These reports reflect sightings and rescue activity submitted by the community. Every report helps
        build a clearer picture of where support is needed most.
      </p>

      <div class="report-grid">
        <article v-for="stat in stats" :key="stat.label" class="report-card">
          <p class="report-label">{{ stat.label }}</p>
          <p class="report-value">{{ stat.value }}</p>
        </article>
      </div>
    </section>

    <section class="box text-block">
      <h2 class="title is-5">Adopt Responsibly</h2>
      <p>
        Always verify details, ask questions about health and behavior, and choose safe public meeting
        points when possible. Responsible adoption protects both people and animals.
      </p>
    </section>

    <MapView />
    <PetListing />

    <section class="box text-block final-cta">
      <h2 class="title is-5">Ready to Help a Pet Today?</h2>
      <p>Whether you're rehoming or adopting, your listing can make a real difference.</p>
    </section>
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

.intro-text p {
  margin-bottom: 0;
}

.intro-image {
  width: 100%;
  height: min(60vh, 520px);
  object-fit: cover;
  border-radius: 0.75rem;
}

.text-block {
  margin: 0 1rem 1.5rem;
}

.text-block p,
.text-block ol {
  margin-bottom: 0;
}

.text-block ol {
  padding-left: 1.25rem;
}

.text-block li + li {
  margin-top: 0.5rem;
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

.final-cta {
  margin-top: 1.5rem;
}
</style>
