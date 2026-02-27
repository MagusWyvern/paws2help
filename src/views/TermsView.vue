<script setup>
import LegalDocument from '../components/LegalDocument.vue'
import termsHtml from '../content/legal/terms-of-use.html?raw'
</script>

<template>
  <LegalDocument :html="termsHtml" />
</template>
