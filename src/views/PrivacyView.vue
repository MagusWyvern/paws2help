<script setup>
import LegalDocument from '../components/LegalDocument.vue'
import privacyHtml from '../content/legal/privacy-policy.html?raw'
</script>

<template>
  <LegalDocument :html="privacyHtml" />
</template>
