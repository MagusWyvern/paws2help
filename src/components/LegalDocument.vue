<script setup>
defineProps({
  html: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <section class="legal-layout">
    <article class="box legal-document content" v-html="html" />
  </section>
</template>

<style scoped>
.legal-layout {
  margin: 2rem 1rem;
}

.legal-document {
  padding: 1.5rem;
}

.legal-document :deep(h1),
.legal-document :deep(h2),
.legal-document :deep(h3) {
  color: #1f2937;
  line-height: 1.25;
}

.legal-document :deep(code) {
  background: #f3f4f6;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}

.legal-document :deep(ul) {
  margin-left: 1.2rem;
}
</style>
